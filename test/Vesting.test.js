const assert = require('assert');
const ganache = require('ganache-cli');
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 1e+9 })
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { tokenVesting, erc20 } = require('../compile');

const {
  SECONDS_PER_MONTH,
  MONTHS_TO_CLIFF,
  MONTHS_TO_RELEASE,
  VESTED_TOKENS,
  TOKENS_PER_MONTH,
  CLIFF_DURATION,
  RELEASABLE_DURATION,
  TOTAL_VEST_DURATION,
  FIRST_PHASE,
  SECOND_PHASE,
} = require('../config');

let vesting;
let token;
let accounts;

const callRPC = (method, params = [], callback) => web3.currentProvider.sendAsync({ id: new Date().getTime(), jasonrpc: '2.0', method, params }, callback)

const tokens = (tokens) => new BigNumber(tokens).multipliedBy(1e+18).toString();

const timeTravel = async seconds => {
  console.log(`Traveling ${seconds} seconds into the future.`)
  await callRPC('evm_increaseTime', [seconds], () => {})
  await callRPC('evm_mine', [], () => {})
}

const testBlocking = () => {
  it('blocks fetching tokens', async () => {
    try {
      const block = await web3.eth.getBlock("latest")
      console.log(`Block number: ${block.number}`)
      console.log(`Block timestamp: ${block.timestamp}`)
      await vesting.methods.release(token.options.address).send({
        from: accounts[0],
      });
      assert.fail();
    } catch (err) {
      assert.ok(/tokens/.test(err.message));
    }
  })
}

const outputBlockNumber = async () => {
  const block = await web3.eth.getBlock("latest")
  console.log(`Block number: ${block.number}`)
  console.log(`Block timestamp: ${new Date(block.timestamp * 1000)}`)
}

before(async () => {
  accounts = await web3.eth.getAccounts();

  const block = await web3.eth.getBlock("latest")
  
  token = await new web3.eth.Contract(JSON.parse(erc20.interface))
    .deploy({ 
      data: erc20.bytecode,
      arguments: [
        accounts[0],
        tokens(VESTED_TOKENS),
      ] 
    })
    .send({
      from: accounts[2],
      gas: '1000000',
    });

  vesting = await new web3.eth.Contract(JSON.parse(tokenVesting.interface))
    .deploy({ 
      data: tokenVesting.bytecode,
      arguments: [
        accounts[1], // bene
        token.options.address, // token
        block.timestamp, // start
        CLIFF_DURATION, //cliff
        TOTAL_VEST_DURATION, // vestDuration
        false, //revoke
        tokens(VESTED_TOKENS), // totalTokens
      ] 
    })
    .send({
      from: accounts[0],
      gas: '1700000',
    });
  outputBlockNumber();

});

describe('Vesting Contract', () => {
  it('deploys a contract', () => {
    assert.ok(vesting.options.address);
  });

  it('tokens are transferred to vesting contract', async () => {
    await token.methods.transfer(vesting.options.address, tokens(VESTED_TOKENS)).send({
      from: accounts[0],
    });
  })

  it('vesting contract has tokens', async () => {
    const balance = await token.methods.balanceOf(vesting.options.address).call({
      from: accounts[0],
    });
    assert.equal(balance, tokens(VESTED_TOKENS))
  })

  it('vesting contract has 10 months for the duration', async () => {
    const months = await vesting.methods.monthsToVest().call({
      from: accounts[0],
    });
    assert.equal(months, ((TOTAL_VEST_DURATION - CLIFF_DURATION)/ SECONDS_PER_MONTH).toString())
  })

  it('blocks fetching tokens before cliff', async () => {
    await outputBlockNumber();
    try {
      await vesting.methods.release().send({
        from: accounts[0],
      });
      assert.fail();
    } catch (err) {
      assert.ok(/Cliff/.test(err.message));
    }
  })

  it(`goes into the future by the cliff`, async () => {
    await timeTravel(CLIFF_DURATION);
  })

  for (let i = 1; i <= FIRST_PHASE; i++) {
    it(`goes into the future by a month`, async () => {
      await timeTravel(SECONDS_PER_MONTH);
    })

    it(`allows fetching tokens at ${i} months`, async () => {
      const release = await vesting.methods.release().send({
        from: accounts[0],
      });
      await outputBlockNumber();
      console.log(`Sent ${release.events['TokensReleased'].returnValues.amount} tokens`)
    })

    it(`beneficiary has balance of ${TOKENS_PER_MONTH * i}`, async () => {
      const balance = await token.methods.balanceOf(accounts[1]).call({
        from: accounts[0],
      });
      console.log(`Beneficiary balance is ${balance}`)
      assert.equal(balance, tokens(TOKENS_PER_MONTH * i))
    })
  }
  
  it(`sets into the future ${SECOND_PHASE} months`, async () => {
    await timeTravel((SECONDS_PER_MONTH * SECOND_PHASE));
  })

  it(`allows fetching tokens at ${FIRST_PHASE + SECOND_PHASE} months`, async () => {
    const release = await vesting.methods.release().send({
      from: accounts[0],
    });
    await outputBlockNumber();
    console.log(`Sent ${release.events['TokensReleased'].returnValues.amount} tokens`)
  })

  it(`beneficiary has balance of ${(FIRST_PHASE + SECOND_PHASE) * TOKENS_PER_MONTH}`, async () => {
    const balance = await token.methods.balanceOf(accounts[1]).call({
      from: accounts[0],
    });
    assert.equal(balance, tokens((FIRST_PHASE + SECOND_PHASE) * TOKENS_PER_MONTH))
  })

  it('blocks fetching tokens', async () => {
    // await outputBlockNumber();
    try {
      await vesting.methods.release().send({
        from: accounts[0],
      });
      assert.fail();
    } catch (err) {
      assert.ok(/tokens/.test(err.message));
    }
  })

  it('blocks revoking tokens', async () => {
    // await outputBlockNumber();
    try {
      await vesting.methods.revoke().send({
        from: accounts[0],
      });
      assert.fail();
    } catch (err) {
      assert.ok(/cannot/.test(err.message));
    }
  })

  it(`sets into the future ${(MONTHS_TO_RELEASE - (Math.floor(MONTHS_TO_RELEASE / 2) + 2))} months`, async () => {
    await timeTravel((SECONDS_PER_MONTH * (MONTHS_TO_RELEASE - (Math.floor(MONTHS_TO_RELEASE / 2) + 2))));
  })

  it(`allows fetching tokens at ${MONTHS_TO_RELEASE} months`, async () => {
    const release = await vesting.methods.release().send({
      from: accounts[0],
    });
    await outputBlockNumber();
    console.log(`Sent ${release.events['TokensReleased'].returnValues.amount} tokens`)
  })

  it('beneficieary all tokens', async () => {
    const balance = await token.methods.balanceOf(accounts[1]).call({
      from: accounts[0],
    });
    assert.equal(balance, tokens(VESTED_TOKENS))
  })

});