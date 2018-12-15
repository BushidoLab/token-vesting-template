const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log("Finding IERC20");
const ierc20Source = fs.readFileSync(path.resolve(__dirname, 'contracts', 'IERC20.sol'), 'utf8');

console.log("Finding SafeMath");
const safeMathSource = fs.readFileSync(path.resolve(__dirname, 'contracts', 'SafeMath.sol'), 'utf8');

console.log("Finding SafeMath64");
const safeMath64Source = fs.readFileSync(path.resolve(__dirname, 'contracts', 'SafeMath64.sol'), 'utf8');

console.log("Finding Ownable");
const ownableSource = fs.readFileSync(path.resolve(__dirname, 'contracts', 'Ownable.sol'), 'utf8');

console.log("Finding SafeERC20");
const safeSource = fs.readFileSync(path.resolve(__dirname, 'contracts', 'SafeERC20.sol'), 'utf8');

console.log("Finding ERC20");
const erc20Source = fs.readFileSync(path.resolve(__dirname, 'contracts', 'ERC20.sol'), 'utf8');

console.log("Finding TokenVesting");
const vestSource = fs.readFileSync(path.resolve(__dirname, 'contracts', 'TokenVesting.sol'), 'utf8');

const input = {
  'IERC20.sol': ierc20Source,
  'Ownable.sol': ownableSource,
  'SafeMath.sol': safeMathSource,
  'SafeMath64.sol': safeMath64Source,
  'SafeERC20.sol': safeSource,
  'TokenVesting.sol': vestSource,
  'ERC20.sol': erc20Source,
};

console.log("Compiling All");
const compiled = solc.compile({sources: input}, 1);
const tokenVesting = compiled.contracts['TokenVesting.sol:TokenVesting'];
const erc20 = compiled.contracts['ERC20.sol:ERC20'];
console.log(compiled.errors)

module.exports = {
  tokenVesting: {
    interface: tokenVesting.interface,
    bytecode: tokenVesting.bytecode,
  },
  erc20: {
    interface: erc20.interface,
    bytecode: erc20.bytecode,
  },
};