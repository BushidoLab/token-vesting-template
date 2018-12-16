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
  THIRD_PHASE,
} = require('../config');

let vesting;
let token;
let accounts;

const callRPC = (method, params = [], callback) => web3.currentProvider.sendAsync({ id: new Date().getTime(), jasonrpc: '2.0', method, params }, callback)

const tokens = (tokens) => new BigNumber(tokens).multipliedBy(1e+18).toString();

const calculateGas = async (method) => {
  const gas = await vesting.methods[method]().estimateGas();
  console.log(`Gas used: ${gas}`)
  return gas;
}

const timeTravel = async seconds => {
  console.log(`Traveling ${seconds / SECONDS_PER_MONTH} months into the future.`)
  await callRPC('evm_increaseTime', [seconds], () => {})
  await callRPC('evm_mine', [], () => {})
}

const testBlocking = () => {
  it('blocks fetching tokens', async () => {
    try {
      const block = await web3.eth.getBlock("latest")
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
  console.log(`Block timestamp: ${new Date(block.timestamp)}`)
}

before(async () => {
  accounts = await web3.eth.getAccounts();
  
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

  const block = await web3.eth.getBlock("latest")

  vesting = await new web3.eth.Contract(JSON.parse(tokenVesting.interface))
    .deploy({ 
      data: tokenVesting.bytecode,
      arguments: [
        accounts[1], // bene
        token.options.address, // token
        block.timestamp, // start
        CLIFF_DURATION, //cliff
        TOTAL_VEST_DURATION, // vestDuration
        true, //revoke
        tokens(VESTED_TOKENS), // tokensPerMonth
      ] 
    });
  const gas = await vesting.estimateGas();
  console.log(`Gas to deploy: ${gas}`);
  vesting = await vesting.send({
      from: accounts[0],
      gas,
    });
  outputBlockNumber();
});

describe('Revoking Tokens from Contract', () => {
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

  it('blocks fetching tokens before cliff', async () => {
    await outputBlockNumber();
    try {
      await vesting.methods.release().send({
        from: accounts[0],
        gas: await calculateGas('release'),
      });
      assert.fail();
    } catch (err) {
      assert.ok(/Cliff/.test(err.message));
    }
  })

  it(`vesting contract has ${MONTHS_TO_RELEASE} months for the duration`, async () => {
    const months = await vesting.methods.monthsToVest().call({
      from: accounts[0],
    });
    assert.equal(months, MONTHS_TO_RELEASE);
  })

  it(`sets into the future past the cliff`, async () => {
    await timeTravel(CLIFF_DURATION);
  })

  for (let i = 1; i <= FIRST_PHASE; i++) {
    it(`goes into the future by a month`, async () => {
      await timeTravel(SECONDS_PER_MONTH);
    })

    it(`allows fetching tokens at ${i} months`, async () => {
      await vesting.methods.release().send({
        from: accounts[0],
        gas: await calculateGas('release'),
      });
    })

    it(`beneficiary has balance of ${TOKENS_PER_MONTH * i}`, async () => {
      const balance = await token.methods.balanceOf(accounts[1]).call({
        from: accounts[0],
      });
      assert.equal(balance, tokens(TOKENS_PER_MONTH * i))
    })
  }
  
  it(`sets into the future ${SECOND_PHASE} months`, async () => {
    await timeTravel(SECOND_PHASE * SECONDS_PER_MONTH);
  })

  it(`tries revoking ${THIRD_PHASE * TOKENS_PER_MONTH} tokens`, async () => {
    const release = await vesting.methods.revoke().send({
      from: accounts[0],
      gas: await calculateGas('revoke'),
    });
    // await outputBlockNumber();
    console.log(`Revoked ${tokens(THIRD_PHASE * TOKENS_PER_MONTH)} tokens`)
    assert.equal(tokens(THIRD_PHASE * TOKENS_PER_MONTH), release.events['TokenVestingRevoked'].returnValues.amount)
  })

  it(`owner has balance of ${tokens(SECOND_PHASE * TOKENS_PER_MONTH)} after revoking`, async () => {
    const balance = await token.methods.balanceOf(accounts[0]).call({
      from: accounts[0],
    });
    assert.equal(balance, tokens((MONTHS_TO_RELEASE - FIRST_PHASE - SECOND_PHASE) * TOKENS_PER_MONTH))
  })

  it(`contract has balance of ${TOKENS_PER_MONTH * SECOND_PHASE} after revoking`, async () => {
    const balance = await token.methods.balanceOf(vesting.options.address).call({
      from: accounts[0],
    });
    assert.equal(balance, tokens(TOKENS_PER_MONTH * SECOND_PHASE));
  })

  it(`allows releasing ${TOKENS_PER_MONTH * SECOND_PHASE} tokens not revoked`, async () => {
    const release = await vesting.methods.release().send({
      from: accounts[0],
      gas: await calculateGas('release'),
    });
    // await outputBlockNumber();
    assert.equal(tokens(TOKENS_PER_MONTH * SECOND_PHASE), release.events['TokensReleased'].returnValues.amount)
  })

  it('blocks revoking tokens', async () => {
    try {
      await vesting.methods.revoke().send({
        from: accounts[0],
        gas: await calculateGas('revoke'),
      });
      assert.fail();
    } catch (err) {
      assert.ok(/already/.test(err.message));
    }
  })

  it('properly blocks releasing when empty', async () => {
    await testBlocking()
  })
});