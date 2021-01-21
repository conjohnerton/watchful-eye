const FlashLoanReceiver = artifacts.require(
  "./deployableContract/flashloans/FlashLoanReceiver.sol"
);

module.exports = function (deployer, network) {
  if (network == "kovan") {
    deployer
      .deploy(FlashLoanReceiver, "0x88757f2f99175387ab4c6a4b3067c77a695b0349")
      .then((instance) => {
        console.log(instance);
      });
  }
};
