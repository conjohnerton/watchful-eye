const axios = require("axios");
const ethers = require("ethers");
const utils = require("ethers/lib/utils");

collateralAssets = [
  ["aUSDT", "0x3ed3b47dd13ec9a98b44e6204a523e766b225811"],
  ["aWBTC", "0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656"],
  ["aWETH", "0x030ba81f1c18d280636f32af80b9aad02cf0854e"],
  ["aYFI", "0x5165d24277cd063f5ac44efd447b27025e888f37"],
  ["aZRX", "0xdf7ff54aacacbff42dfe29dd6144a69b629f8c9e"],
  ["aUNI", "0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1"],
  ["aAAVE", "0xffc97d72e13e01096502cb8eb52dee56f74dad7b"],
  ["aBAT", "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1"],
  ["aBUSD", "0xa361718326c15715591c299427c62086f69923d9"],
  ["aDAI", "0x028171bca77440897b824ca71d1c56cac55b68a3"],
  ["aENJ", "0xac6df26a590f08dcc95d5a4705ae8abbc88509ef"],
  ["aKNC", "0x39c6b3e42d6a679d7d776778fe880bc9487c2eda"],
  ["aLINK", "0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0"],
  ["aMANA", "0xa685a61171bb30d4072b338c80cb7b2c865c873e"],
  ["aMKR", "0xc713e5e149d5d0715dcd1c156a020976e7e56b88"],
  ["aREN", "0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a"],
  ["aSNX", "0x35f6b052c598d933d69a4eec4d04c73a191fe6c2"],
  ["aSUSD", "0x6c5024cd4f8a59110119c56f8933403a539555eb"],
  ["aTUSD", "0x101cc05f4a51c0319f570d5e146a8c625198e636"],
  ["aUSDC", "0xbcca60bb61934080951369a648fb03df4f96263c"],
  ["aCRV", "0x8dae6cb04688c62d939ed9b68d32bc62e49970b1"],
  ["aGUSD", "0xd37ee7e4f452c6638c96536e68090de8cbcdb583"],
  ["aBAL", "0x272f97b7a56a387ae942350bbc7df5700f8a4576"],
];

debtAssets = [
  ["USDT", "0xdac17f958d2ee523a2206206994597c13d831ec7"],
  ["WBTC", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"],
  ["WETH", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
  ["YFI", "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e"],
  ["ZRX", "0xe41d2489571d322189246dafa5ebde1f4699f498"],
  ["UNI", "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"],
  ["AAVE", "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"],
  ["BAT", "0x0d8775f648430679a709e98d2b0cb6250d2887ef"],
  ["BUSD", "0x4fabb145d64652a948d72533023f6e7a623c7c53"],
  ["DAI", "0x6b175474e89094c44da98b954eedeac495271d0f"],
  ["ENJ", "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c"],
  ["KNC", "0xdd974d5c2e2928dea5f71b9825b8b646686bd200"],
  ["LINK", "0x514910771af9ca656af840dff83e8264ecf986ca"],
  ["MANA", "0x0f5d2fb29fb7d3cfee444a200298f468908cc942"],
  ["MKR", "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"],
  ["REN", "0x408e41876cccdc0f92210600ef50372656052a38"],
  ["SNX", "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f"],
  ["sUSD", "0x57ab1ec28d129707052df4df418d58a2d46d5f51"],
  ["TUSD", "0x0000000000085d4780b73119b644ae5ecd22b376"],
  ["USDC", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
  ["CRV", "0xd533a949740bb3306d119cc777fa900ba034cd52"],
  ["GUSD", "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd"],
  ["BAL", "0xba100000625a3754423978a60c9317c58a424e3d"],
];

const localProvider = new ethers.providers.JsonRpcProvider(
  "http://localhost:8545"
);

const contractArtifact = require("../react-app/src/contracts/TheWatchfulEye.address");

const abi = require("../hardhat/artifacts/contracts/TheWatchfulEye.sol/TheWatchfulEye.json")
  .abi;

// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
let contract = new ethers.Contract(
  contractArtifact,
  abi,
  localProvider.getSigner(0)
);

setInterval(() => {
  const oneTrueEye = async () => {
    console.log("Getting the Watchful Eye...")
    const currentEye = await contract.getWatchfulEye();
    currentCollateralPriceLimit = utils.formatUnits(currentEye[1]._hex, "wei");
    currentDebtPriceLimit = utils.formatUnits(currentEye[2]._hex, "wei");
    currentTotalCollateralCount = currentEye[3];
    currentDebtCount = currentEye[4];
    currentdebtAsset = currentEye[5];
    currentcollateralAsset = currentEye[6];
    currentReserveAsset = currentEye[7];

    if (utils.formatUnits(currentReserveAsset, "wei") == 0 && utils.formatUnits(currentdebtAsset, "wei") == 0) {
      console.log('No Watchful Eye found.');
      return;
    }

    const getPrice = async () => {
      const debt = debtAssets.find((val) => {
        val[1];
        return parseInt(val[1]) === parseInt(currentdebtAsset);
      });

      const collateral = collateralAssets.find((val) => {
        val[1];
        return parseInt(val[1]) === parseInt(currentcollateralAsset);
      });

      if (!collateral || !debt) {
        return;
      }

      const currentDebtToken = `https://min-api.cryptocompare.com/data/price?fsym=${debt[0]}&tsyms=USD`;
      const currentCollateralToken = `https://min-api.cryptocompare.com/data/price?fsym=${collateral[0].slice(
        1
      )}&tsyms=USD`;

      const requestDebtToken = await axios.get(currentDebtToken);
      const requestCollateral = await axios.get(currentCollateralToken);

      return {
        debtTokenPrice: requestDebtToken.data["USD"],
        colalteralTokenPrice: requestCollateral.data["USD"],
      };
    };

    const { debtTokenPrice, colalteralTokenPrice } = await getPrice();

    if (
      debtTokenPrice > currentDebtPriceLimit ||
      colalteralTokenPrice < currentCollateralPriceLimit
    ) {
      console.log("Liquidating position...");

      try {
        await contract.makeFlashLoan();
        console.log("Succesfully liquidated the position watched by The Watchful Eye. Moving on...")
      } catch (err) {
        console.error("Could not complete liquidation...")
        console.error("Error: ", err)
      }
    } else {
      console.log("Position safe.")
      console.log("Debt Price/Limit", debtTokenPrice, currentDebtPriceLimit)
      console.log("Collateral Price/Limit", colalteralTokenPrice, currentCollateralPriceLimit)
    }
  };
  oneTrueEye();
}, 14000);

10000000000000000000
10000000000000000000
10000000005179950860
