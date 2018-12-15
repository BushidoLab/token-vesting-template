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

const tokens = (tokens) => new BigNumber(tokens).multipliedBy(1e+18).toString();

const SECONDS_PER_MONTH = 2628000;
const LOCKED_BALANCE = tokens(1200);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy from ", accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(tokenVesting.interface))
    .deploy({
      data: tokenVesting.bytecode,
      arguments: [
        accounts[0], // beneficiary
        TOKENADDRESS, // token
        Date.now(), // start timestamp
        SECONDS_PER_MONTH * 12, // cliff for a year
        (SECONDS_PER_MONTH * 12 + 30).toString(), // Release every month for a year
        false, //revoke
        tokens(100), // Tokens to release every month
      ]
    })
    .send({
      gas: "1600000",
      from: accounts[0]
    });
  result.setProvider(provider);

  console.log("Contract deployed to: ", result.options.address);
};
deploy();
