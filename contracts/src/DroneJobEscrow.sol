// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DroneJobEscrow
 * @notice Smart contract for managing drone service requests, bids, escrow, and disputes
 */
contract DroneJobEscrow {
    // ============ Enums ============
    
    enum RequestStatus {
        Open,
        BidAccepted,
        InProgress,
        Delivered,
        Completed,
        Disputed,
        Cancelled
    }
    
    enum BidStatus {
        Pending,
        Accepted,
        Rejected,
        Completed
    }
    
    enum DisputeStatus {
        None,
        Pending,
        Resolved
    }
    
    // ============ Structs ============
    
    struct Request {
        uint256 requestId;
        address consumer;
        string title;
        string description;
        uint256 budget; // in wei
        uint256 deadline; // timestamp
        RequestStatus status;
        uint256 acceptedBidId;
        uint256 createdAt;
    }
    
    struct Bid {
        uint256 bidId;
        uint256 requestId;
        address provider;
        uint256 amount; // in wei
        uint256 timeline; // days
        BidStatus status;
        uint256 createdAt;
    }
    
    struct Dispute {
        uint256 requestId;
        address initiator;
        string reason;
        DisputeStatus status;
        address arbitrator;
        uint256 createdAt;
    }
    
    // ============ State Variables ============
    
    address public owner;
    address public arbitrator;
    
    uint256 public nextRequestId = 1;
    uint256 public nextBidId = 1;
    
    mapping(uint256 => Request) public requests;
    mapping(uint256 => Bid) public bids;
    mapping(uint256 => uint256[]) public requestBids; // requestId => bidIds[]
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public escrowBalances; // requestId => amount in escrow
    
    // ============ Events ============
    
    event RequestCreated(
        uint256 indexed requestId,
        address indexed consumer,
        string title,
        uint256 budget,
        uint256 deadline
    );
    
    event BidSubmitted(
        uint256 indexed bidId,
        uint256 indexed requestId,
        address indexed provider,
        uint256 amount
    );
    
    event BidAccepted(
        uint256 indexed requestId,
        uint256 indexed bidId,
        address indexed provider,
        uint256 amount
    );
    
    event JobDelivered(
        uint256 indexed requestId,
        address indexed provider
    );
    
    event DeliveryApproved(
        uint256 indexed requestId,
        address indexed provider,
        uint256 amount
    );
    
    event DisputeInitiated(
        uint256 indexed requestId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed requestId,
        address indexed arbitrator,
        bool favorConsumer
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Not arbitrator");
        _;
    }
    
    modifier validRequest(uint256 _requestId) {
        require(requests[_requestId].requestId != 0, "Request does not exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _arbitrator) {
        owner = msg.sender;
        arbitrator = _arbitrator;
    }
    
    // ============ Functions ============
    
    /**
     * @notice Create a new drone service request
     * @param _title Title of the request
     * @param _description Description of the work needed
     * @param _budget Budget in wei
     * @param _deadline Deadline timestamp
     */
    function createRequest(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _deadline
    ) external returns (uint256) {
        require(_budget > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        uint256 requestId = nextRequestId++;
        
        requests[requestId] = Request({
            requestId: requestId,
            consumer: msg.sender,
            title: _title,
            description: _description,
            budget: _budget,
            deadline: _deadline,
            status: RequestStatus.Open,
            acceptedBidId: 0,
            createdAt: block.timestamp
        });
        
        emit RequestCreated(requestId, msg.sender, _title, _budget, _deadline);
        
        return requestId;
    }
    
    /**
     * @notice Submit a bid for a request
     * @param _requestId The request ID to bid on
     * @param _amount Bid amount in wei
     * @param _timeline Timeline in days
     */
    function submitBid(
        uint256 _requestId,
        uint256 _amount,
        uint256 _timeline
    ) external validRequest(_requestId) returns (uint256) {
        Request storage request = requests[_requestId];
        require(request.status == RequestStatus.Open, "Request not open");
        require(msg.sender != request.consumer, "Cannot bid on own request");
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= request.budget, "Bid exceeds budget");
        
        uint256 bidId = nextBidId++;
        
        bids[bidId] = Bid({
            bidId: bidId,
            requestId: _requestId,
            provider: msg.sender,
            amount: _amount,
            timeline: _timeline,
            status: BidStatus.Pending,
            createdAt: block.timestamp
        });
        
        requestBids[_requestId].push(bidId);
        
        emit BidSubmitted(bidId, _requestId, msg.sender, _amount);
        
        return bidId;
    }
    
    /**
     * @notice Accept a bid and lock funds in escrow
     * @param _requestId The request ID
     * @param _bidId The bid ID to accept
     */
    function acceptBid(
        uint256 _requestId,
        uint256 _bidId
    ) external payable validRequest(_requestId) {
        Request storage request = requests[_requestId];
        Bid storage bid = bids[_bidId];
        
        require(request.consumer == msg.sender, "Only consumer can accept");
        require(request.status == RequestStatus.Open, "Request not open");
        require(bid.requestId == _requestId, "Bid not for this request");
        require(bid.status == BidStatus.Pending, "Bid not pending");
        require(msg.value >= bid.amount, "Insufficient payment");
        
        request.status = RequestStatus.BidAccepted;
        request.acceptedBidId = _bidId;
        bid.status = BidStatus.Accepted;
        
        escrowBalances[_requestId] = msg.value;
        
        // Refund excess if any
        if (msg.value > bid.amount) {
            payable(msg.sender).transfer(msg.value - bid.amount);
            escrowBalances[_requestId] = bid.amount;
        }
        
        emit BidAccepted(_requestId, _bidId, bid.provider, bid.amount);
    }
    
    /**
     * @notice Mark job as delivered
     * @param _requestId The request ID
     */
    function deliverJob(uint256 _requestId) external validRequest(_requestId) {
        Request storage request = requests[_requestId];
        Bid storage bid = bids[request.acceptedBidId];
        
        require(bid.provider == msg.sender, "Only provider can deliver");
        require(request.status == RequestStatus.BidAccepted, "Invalid status");
        
        request.status = RequestStatus.Delivered;
        
        emit JobDelivered(_requestId, msg.sender);
    }
    
    /**
     * @notice Approve delivery and release payment
     * @param _requestId The request ID
     */
    function approveDelivery(uint256 _requestId) external validRequest(_requestId) {
        Request storage request = requests[_requestId];
        Bid storage bid = bids[request.acceptedBidId];
        
        require(request.consumer == msg.sender, "Only consumer can approve");
        require(request.status == RequestStatus.Delivered, "Job not delivered");
        require(disputes[_requestId].status != DisputeStatus.Pending, "Dispute pending");
        
        request.status = RequestStatus.Completed;
        bid.status = BidStatus.Completed;
        
        uint256 amount = escrowBalances[_requestId];
        escrowBalances[_requestId] = 0;
        
        payable(bid.provider).transfer(amount);
        
        emit DeliveryApproved(_requestId, bid.provider, amount);
    }
    
    /**
     * @notice Initiate a dispute
     * @param _requestId The request ID
     * @param _reason Reason for dispute
     */
    function disputeDelivery(
        uint256 _requestId,
        string memory _reason
    ) external validRequest(_requestId) {
        Request storage request = requests[_requestId];
        
        require(
            msg.sender == request.consumer || msg.sender == bids[request.acceptedBidId].provider,
            "Not authorized"
        );
        require(
            request.status == RequestStatus.Delivered || request.status == RequestStatus.BidAccepted,
            "Invalid status"
        );
        require(disputes[_requestId].status == DisputeStatus.None, "Dispute already exists");
        
        disputes[_requestId] = Dispute({
            requestId: _requestId,
            initiator: msg.sender,
            reason: _reason,
            status: DisputeStatus.Pending,
            arbitrator: arbitrator,
            createdAt: block.timestamp
        });
        
        request.status = RequestStatus.Disputed;
        
        emit DisputeInitiated(_requestId, msg.sender, _reason);
    }
    
    /**
     * @notice Arbitrator resolves dispute
     * @param _requestId The request ID
     * @param _favorConsumer If true, refund consumer; if false, pay provider
     */
    function arbitrate(
        uint256 _requestId,
        bool _favorConsumer
    ) external onlyArbitrator validRequest(_requestId) {
        Dispute storage dispute = disputes[_requestId];
        Request storage request = requests[_requestId];
        Bid storage bid = bids[request.acceptedBidId];
        
        require(dispute.status == DisputeStatus.Pending, "Dispute not pending");
        
        dispute.status = DisputeStatus.Resolved;
        request.status = RequestStatus.Completed;
        bid.status = BidStatus.Completed;
        
        uint256 amount = escrowBalances[_requestId];
        escrowBalances[_requestId] = 0;
        
        if (_favorConsumer) {
            payable(request.consumer).transfer(amount);
        } else {
            payable(bid.provider).transfer(amount);
        }
        
        emit DisputeResolved(_requestId, msg.sender, _favorConsumer);
    }
    
    /**
     * @notice Get request details
     */
    function getRequest(uint256 _requestId) external view returns (Request memory) {
        return requests[_requestId];
    }
    
    /**
     * @notice Get bid details
     */
    function getBid(uint256 _bidId) external view returns (Bid memory) {
        return bids[_bidId];
    }
    
    /**
     * @notice Get all bids for a request
     */
    function getRequestBids(uint256 _requestId) external view returns (uint256[] memory) {
        return requestBids[_requestId];
    }
    
    /**
     * @notice Update arbitrator (only owner)
     */
    function setArbitrator(address _newArbitrator) external onlyOwner {
        require(_newArbitrator != address(0), "Invalid address");
        arbitrator = _newArbitrator;
    }
    
    /**
     * @notice Emergency withdraw (only owner, for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
