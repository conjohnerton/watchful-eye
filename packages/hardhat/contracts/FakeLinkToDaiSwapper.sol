pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeMath } from './aave/dependencies/openzeppelin/contracts/SafeMath.sol';
import { Ownable } from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeLinkToDaiSwapper is Ownable {
    using SafeMath for uint256;

    IERC20 daiToken = IERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);
    IERC20 linkToken = IERC20(0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789);

    receive() external payable {}

    function doSwap(address fromAsset, address toAsset, uint256 amount) external returns (bool didSwap) {
        (bool successOne) = IERC20(fromAsset).transferFrom(msg.sender, address(this), amount);
        require(successOne, "Could not transfer from The Watchful Eye to FakeLinkToDaiSwapper.");

        // Since we're using Link and Dai in this example, we'll just use an example price.
        // This is a fake exchange after all ;)
        uint256 priceMultiplier = 20;

        // uint256 balance = IERC20(toAsset).balanceOf(address(this));
        (bool successTwo) = IERC20(toAsset).transfer(msg.sender, daiToken.balanceOf(address(this)));
        require(successTwo, "Could not transfer from FakeLinkToDaiSwapper to The Watchful Eye.");
        
        return true;
    }
}