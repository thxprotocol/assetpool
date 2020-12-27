// SPDX-License-Identifier: Apache-2.0
import "diamond-2/contracts/interfaces/IERC173.sol";
import "diamond-2/contracts/interfaces/IDiamondLoupe.sol";
import "diamond-2/contracts/interfaces/IDiamondCut.sol";
import "./IGasStation.sol";
import "./IRewardPoll.sol";
import "./IRewardPollFacet.sol";
import "./IWithdrawPoll.sol";
import "./IWithdrawPollFacet.sol";
import "./IBasePoll.sol";
import "./IAssetPool.sol";
import "./IAssetPoolView.sol";
import "./IRoles.sol";
import "./IAccessControl.sol";

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface ISolution is
    IERC173,
    IDiamondLoupe,
    IDiamondCut,
    IGasStation,
    IBasePoll,
    IRewardPoll,
    IRewardPollFacet,
    IWithdrawPoll,
    IWithdrawPollFacet,
    IAssetPool,
    IAssetPoolView,
    IRoles,
    IAccessControl
{}
