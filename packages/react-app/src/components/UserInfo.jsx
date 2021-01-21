import React from "react";

export default ({
  availableBorrowsETH,
  currentLiquidationThreshold,
  healthFactor,
  ltv,
  totalCollateralETH,
  totalDebtETH,
}) => {
  return (
    <div>
      <p>availableBorrowsETH: {availableBorrowsETH}</p>
      <p>currentLiquidationThreshold: {currentLiquidationThreshold}</p>
      <p>healthFactor: {healthFactor}</p>
      <p>ltv: {ltv}</p>
      <p>totalCollateralETH: {totalCollateralETH}</p>
      <p>totalDebtETH: {totalDebtETH}</p>
    </div>
  );
};
