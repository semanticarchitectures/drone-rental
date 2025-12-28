// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {DroneJobEscrow} from "../src/DroneJobEscrow.sol";

contract DroneJobEscrowTest is Test {
    DroneJobEscrow public escrow;
    
    address public owner;
    address public arbitrator;
    address public consumer;
    address public provider;
    
    uint256 public constant BUDGET = 1 ether;
    uint256 public constant BID_AMOUNT = 0.8 ether;
    uint256 public constant TIMELINE = 7 days;
    
    function setUp() public {
        owner = address(this);
        arbitrator = makeAddr("arbitrator");
        consumer = makeAddr("consumer");
        provider = makeAddr("provider");
        
        escrow = new DroneJobEscrow(arbitrator);
        
        // Fund accounts
        vm.deal(consumer, 10 ether);
        vm.deal(provider, 10 ether);
    }
    
    function test_CreateRequest() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        assertEq(requestId, 1);
        DroneJobEscrow.Request memory request = escrow.getRequest(requestId);
        assertEq(request.consumer, consumer);
        assertEq(request.budget, BUDGET);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.Open));
    }
    
    function test_SubmitBid() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(provider);
        uint256 bidId = escrow.submitBid(requestId, BID_AMOUNT, TIMELINE);
        
        assertEq(bidId, 1);
        DroneJobEscrow.Bid memory bid = escrow.getBid(bidId);
        assertEq(bid.provider, provider);
        assertEq(bid.amount, BID_AMOUNT);
        assertEq(uint256(bid.status), uint256(DroneJobEscrow.BidStatus.Pending));
    }
    
    function test_AcceptBid() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(provider);
        uint256 bidId = escrow.submitBid(requestId, BID_AMOUNT, TIMELINE);
        
        vm.prank(consumer);
        escrow.acceptBid{value: BID_AMOUNT}(requestId, bidId);
        
        DroneJobEscrow.Request memory request = escrow.getRequest(requestId);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.BidAccepted));
        assertEq(escrow.escrowBalances(requestId), BID_AMOUNT);
    }
    
    function test_DeliverAndApprove() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(provider);
        uint256 bidId = escrow.submitBid(requestId, BID_AMOUNT, TIMELINE);
        
        vm.prank(consumer);
        escrow.acceptBid{value: BID_AMOUNT}(requestId, bidId);
        
        vm.prank(provider);
        escrow.deliverJob(requestId);
        
        DroneJobEscrow.Request memory request = escrow.getRequest(requestId);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.Delivered));
        
        uint256 providerBalanceBefore = provider.balance;
        
        vm.prank(consumer);
        escrow.approveDelivery(requestId);
        
        assertEq(provider.balance, providerBalanceBefore + BID_AMOUNT);
        request = escrow.getRequest(requestId);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.Completed));
    }
    
    function test_DisputeAndArbitrate() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(provider);
        uint256 bidId = escrow.submitBid(requestId, BID_AMOUNT, TIMELINE);
        
        vm.prank(consumer);
        escrow.acceptBid{value: BID_AMOUNT}(requestId, bidId);
        
        vm.prank(consumer);
        escrow.disputeDelivery(requestId, "Quality issue");
        
        DroneJobEscrow.Request memory request = escrow.getRequest(requestId);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.Disputed));
        
        uint256 consumerBalanceBefore = consumer.balance;
        
        vm.prank(arbitrator);
        escrow.arbitrate(requestId, true); // Favor consumer
        
        assertEq(consumer.balance, consumerBalanceBefore + BID_AMOUNT);
        request = escrow.getRequest(requestId);
        assertEq(uint256(request.status), uint256(DroneJobEscrow.RequestStatus.Completed));
    }
    
    function test_RevertIfConsumerBidsOnOwnRequest() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(consumer);
        vm.expectRevert("Cannot bid on own request");
        escrow.submitBid(requestId, BID_AMOUNT, TIMELINE);
    }
    
    function test_RevertIfBidExceedsBudget() public {
        vm.prank(consumer);
        uint256 requestId = escrow.createRequest(
            "Test Request",
            "Test Description",
            BUDGET,
            block.timestamp + 30 days
        );
        
        vm.prank(provider);
        vm.expectRevert("Bid exceeds budget");
        escrow.submitBid(requestId, BUDGET + 1, TIMELINE);
    }
}

