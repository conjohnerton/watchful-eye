import { formatEther } from "@ethersproject/units";

export default ({
  availableBorrowsETH,
  currentLiquidationThreshold,
  healthFactor,
  ltv,
  totalCollateralETH,
  totalDebtETH,
}) => ({
  availableBorrowsETH: formatEther(availableBorrowsETH.toString()),
  currentLiquidationThreshold: formatEther(currentLiquidationThreshold.toString()),
  healthFactor: formatEther(healthFactor.toString()),
  ltv: formatEther(ltv.toString()),
  totalCollateralETH: formatEther(totalCollateralETH.toString()),
  totalDebtETH: formatEther(totalDebtETH.toString()),
});
