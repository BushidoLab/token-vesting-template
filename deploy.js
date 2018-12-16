const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 1e+9 })
const { tokenVesting } = require('./compile');

const provider = new HDWalletProvider(
  "brand accuse source mesh guilt version siren risk electric proof bulb time",
  "http://localhost:8545"
);
const web3 = new Web3(provider);

const {
  SECONDS_PER_MONTH,
  VESTED_TOKENS,
  CLIFF_DURATION,
  TOTAL_VEST_DURATION,
} = require('./config');

const tokens = (tokens) => new BigNumber(tokens).multipliedBy(1e+18).toString();

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy from ", accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(tokenVesting.interface))
    .deploy({
      data: tokenVesting.bytecode,
      arguments: [
        BENEFICIARYADDRESS, // bene
        TOKENADDRESS, // token
        STARTINGTIME- Date.now() / 1000, // start
        CLIFF_DURATION, //cliff
        TOTAL_VEST_DURATION, // vestDuration
        SET_REVOKABLE, //revoke
        tokens(VESTED_TOKENS), // tokensPerMonth
      ]
    });

  result = result.send({
      gas: await result.estimateGas(),
      from: accounts[0]
    });
  result.setProvider(provider);

  console.log("Contract deployed to: ", result.options.address);
};
deploy();
