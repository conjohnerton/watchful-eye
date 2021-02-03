/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers, network } = require("hardhat");
const { Contract } = require("ethers");
const { utils } = require("ethers");
const R = require("ramda");
const {
  abi: erc20abi,
} = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const {
  abi: lendingPoolABI,
} = require("../artifacts/contracts/aave/protocol/lendingpool/LendingPool.sol/LendingPool.json");
const { parseUnits, formatUnits } = require("ethers/lib/utils");

const LENDING_POOL_ADDRESS = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"; // mainnet

const main = async () => {
  console.log("\n\n 📡 Deploying...\n");

  // const FakeEthToDaiSwapper = await deploy("FakeLinkToDaiSwapper", []);

  // const FakeDebtToCollateralSwapper = await deploy(
  //   "FakeDebtToCollateralSwapper",
  //   []
  // );

  // 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5 mainnnet
  // 0x88757f2f99175387ab4c6a4b3067c77a695b0349 kovan
  const WatchfulEyeContract = await deploy("TheWatchfulEye", [
    LENDING_POOL_ADDRESS, // Aave mainnet lending pool address provider
    // "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E", // 1Inch mainnet address
    "0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e", // 1Inch mainnet beta address (working!!!! I think)
    // FakeEthToDaiSwapper.address,
    // FakeDebtToCollateralSwapper.address,
  ]);

  await giveDAIToMyAccount();
  // await getAaveLoanOnAccount();

  // Impersonate aLink holder
  // await network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: ["0x80845058350B8c3Df5c3015d8a717D64B3bF9267"],
  // });

  // const Ausdcsigner = ethers.provider.getSigner(
  //   "0x80845058350B8c3Df5c3015d8a717D64B3bF9267"
  // );
  // const ausdc = new Contract(
  //   "0xBcca60bB61934080951369a648Fb03DF4F96263C", // aDai 0x028171bCA77440897B824Ca71D1c56caC55b68A3
  //   erc20abi,
  //   Ausdcsigner
  // );

  // const balance = await ausdc.balanceOf(
  //   "0x80845058350B8c3Df5c3015d8a717D64B3bF9267"
  // );
  // console.log(formatUnits(balance._hex, "wei") - 1000);
  // // await ausdc.transfer("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", balance._hex);
  // await ausdc.transfer(
  //   FakeDebtToCollateralSwapper.address,
  //   parseUnits("1000", "wei")
  // );

  // console.log("Transfer complete");

  // await network.provider.request({
  //   method: "hardhat_stopImpersonatingAccount",
  //   params: ["0x80845058350B8c3Df5c3015d8a717D64B3bF9267"],
  // });

  // console.log(await ausdc.balanceOf(FakeDebtToCollateralSwapper.address));

  // // impersonate whale account
  // chalk.greenBright("Switching to whale account!");

  // const exampleToken = await deploy("ExampleToken")
  // const examplePriceOracle = await deploy("ExamplePriceOracle")
  // const smartContractWallet = await deploy("SmartContractWallet",[exampleToken.address,examplePriceOracle.address])

  /*

  //If you want to send some ETH to a contract on deploy (make your constructor payable!)

  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  console.log(
    " 💾  Artifacts (address, abi, and args) saved to: ",
    chalk.blue("packages/hardhat/artifacts/"),
    "\n\n"
  );
};

const getAaveLoanOnAccount = async () => {
  const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const aave = new Contract(
    LENDING_POOL_ADDRESS,
    lendingPoolABI,
    ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
  );
  const dai = new Contract(
    DAI_ADDRESS,
    erc20abi,
    ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
  );

  const balance = await dai.balanceOf(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  );
  console.log(balance._hex);
  console.log(formatUnits(balance._hex, "wei"));
  await dai.approve(
    LENDING_POOL_ADDRESS,
    parseUnits("100000000000000000", "wei")
  );

  await aave.deposit(
    DAI_ADDRESS,
    parseUnits("10000000000000000", "wei"),
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    parseUnits("0")
  );

  console.log(chalk.greenBright("Deposited to Aave!"));

  const res = await aave.borrow(
    DAI_ADDRESS,
    parseUnits("100", "wei"),
    parseUnits("1", "wei"),
    parseUnits("0", "wei"),
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  );

  console.log(res);
};

const giveDAIToMyAccount = async () => {
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  await network.provider.request(
    {
      method: "hardhat_impersonateAccount",
      params: ["0x708396f17127c42383E3b9014072679b2F60B82f"],
    } // Whale account
  );

  // Fund the contracts for the mock operations.
  const Whalesigner = ethers.provider.getSigner(
    "0x708396f17127c42383E3b9014072679b2F60B82f"
  );

  const token = new Contract(
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    erc20abi,
    Whalesigner
  );
  await token.transfer(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    parseUnits("10")
  ); 

  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: ["0x708396f17127c42383E3b9014072679b2F60B82f"],
  });

  console.log(chalk.greenBright("Token sent to user for tests!"));
};

const deploy = async (contractName, _args = [], overrides = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName);
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address)
  );

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf(".sol") >= 0 &&
  fileName.indexOf(".swp") < 0 &&
  fileName.indexOf(".swap") < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
