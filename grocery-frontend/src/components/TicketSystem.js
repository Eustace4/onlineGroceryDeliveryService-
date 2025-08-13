import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Send,
  Paperclip,
  Download,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import './TicketSystem.css';

const TicketSystem = () => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'detail'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  // Mock data - replace with API calls
  const mockTickets = [
    {
      id: 1,
      subject: "Payment not working",
      description: "I tried to make a payment but it keeps failing. I've tried multiple cards.",
      status: "open",
      priority: "high",
      type: "payment",
      user: {
        id: 101,
        name: "John Doe",
        email: "john.doe@email.com",
        role: "customer"
      },
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      assigned_to: null,
      messages: [
        {
          id: 1,
          message: "I tried to make a payment but it keeps failing. I've tried multiple cards.",
          sender_type: "user",
          sender: "John Doe",
          created_at: "2024-01-15T10:30:00Z",
          attachments: []
        }
      ],
      attachments: []
    },
    {
      id: 2,
      subject: "Order delivery issue",
      description: "My order was supposed to be delivered yesterday but I haven't received it yet.",
      status: "in_progress",
      priority: "medium",
      type: "delivery",
      user: {
        id: 102,
        name: "Jane Smith",
        email: "jane.smith@email.com",
        role: "customer"
      },
      created_at: "2024-01-14T15:45:00Z",
      updated_at: "2024-01-15T09:20:00Z",
      assigned_to: "Admin User",
      messages: [
        {
          id: 2,
          message: "My order was supposed to be delivered yesterday but I haven't received it yet.",
          sender_type: "user",
          sender: "Jane Smith",
          created_at: "2024-01-14T15:45:00Z",
          attachments: []
        },
        {
          id: 3,
          message: "I'm looking into this issue. Can you please provide your order number?",
          sender_type: "admin",
          sender: "Admin User",
          created_at: "2024-01-15T09:20:00Z",
          attachments: []
        }
      ],
      attachments: []
    },
    {
      id: 3,
      subject: "Account verification problem",
      description: "I'm having trouble verifying my vendor account. The verification email never arrived.",
      status: "resolved",
      priority: "low",
      type: "account",
      user: {
        id: 103,
        name: "Mike Johnson",
        email: "mike.johnson@email.com",
        role: "vendor"
      },
      created_at: "2024-01-13T11:15:00Z",
      updated_at: "2024-01-14T16:30:00Z",
      assigned_to: "Admin User",
      messages: [
        {
          id: 4,
          message: "I'm having trouble verifying my vendor account. The verification email never arrived.",
          sender_type: "user",
          sender: "Mike Johnson",
          created_at: "2024-01-13T11:15:00Z",
          attachments: []
        },
        {
          id: 5,
          message: "I've resent the verification email. Please check your spam folder as well.",
          sender_type: "admin",
          sender: "Admin User",
          created_at: "2024-01-14T16:30:00Z",
          attachments: []
        }
      ],
      attachments: []
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchTickets = async () => {
      setLoading(true);
      // Replace with actual API call
      setTimeout(() => {
        setTickets(mockTickets);
        setFilteredTickets(mockTickets);
        
        // Calculate stats
        const stats = {
          total: mockTickets.length,
          open: mockTickets.filter(t => t.status === 'open').length,
          inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
          resolved: mockTickets.filter(t => t.status === 'resolved').length,
          closed: mockTickets.filter(t => t.status === 'closed').length
        };
        setTicketStats(stats);
        setLoading(false);
      }, 1000);
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    // Filter tickets based on search and filters
    let filtered = tickets.filter(ticket => {
      const matchesSearch = 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === '' || ticket.priority === priorityFilter;
      const matchesType = typeFilter === '' || ticket.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });

    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, priorityFilter, typeFilter, tickets]);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedTicket(null);
    setReplyMessage('');
    setSelectedFile(null);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      // API call to update status
      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() } : ticket
      );
      setTickets(updatedTickets);
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() && !selectedFile) return;

    try {
      const newMessage = {
        id: Date.now(),
        message: replyMessage,
        sender_type: "admin",
        sender: "Admin User",
        created_at: new Date().toISOString(),
        attachments: selectedFile ? [{ name: selectedFile.name, size: selectedFile.size }] : []
      };

      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMessage],
        updated_at: new Date().toISOString(),
        status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
      };

      setSelectedTicket(updatedTicket);
      
      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      );
      setTickets(updatedTickets);

      setReplyMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <MessageCircle className="status-icon open" />;
      case 'in_progress': return <Clock className="status-icon in-progress" />;
      case 'resolved': return <CheckCircle className="status-icon resolved" />;
      case 'closed': return <XCircle className="status-icon closed" />;
      default: return <MessageCircle className="status-icon" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTicketStats = () => (
    <div className="ticket-stats">
      <div className="stat-card">
        <div className="stat-number">{ticketStats.total}</div>
        <div className="stat-label">Total Tickets</div>
      </div>
      <div className="stat-card open">
        <div className="stat-number">{ticketStats.open}</div>
        <div className="stat-label">Open</div>
      </div>
      <div className="stat-card in-progress">
        <div className="stat-number">{ticketStats.inProgress}</div>
        <div className="stat-label">In Progress</div>
      </div>
      <div className="stat-card resolved">
        <div className="stat-number">{ticketStats.resolved}</div>
        <div className="stat-label">Resolved</div>
      </div>
      <div className="stat-card closed">
        <div className="stat-number">{ticketStats.closed}</div>
        <div className="stat-label">Closed</div>
      </div>
    </div>
  );

  const renderTicketList = () => (
    <div className="ticket-list-view">
      <div className="ticket-header">
        <h2>
          <MessageSquare size={24} />
          Support Tickets
        </h2>
        <p>Manage customer support tickets and inquiries</p>
      </div>

      {renderTicketStats()}

      <div className="ticket-filters">
        <div className="search-filter">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="payment">Payment</option>
            <option value="delivery">Delivery</option>
            <option value="account">Account</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading tickets...</div>
      ) : (
        <div className="tickets-container">
          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} />
              <h3>No tickets found</h3>
              <p>No tickets match your current filters.</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className={`ticket-card ${ticket.status}`}>
                  <div className="ticket-card-header">
                    <div className="ticket-priority" style={{ backgroundColor: getPriorityColor(ticket.priority) }}>
                      {ticket.priority}
                    </div>
                    <div className="ticket-status">
                      {getStatusIcon(ticket.status)}
                      <span>{ticket.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="ticket-card-content">
                    <h3 className="ticket-subject">{ticket.subject}</h3>
                    <p className="ticket-description">{ticket.description}</p>
                    
                    <div className="ticket-meta">
                      <div className="ticket-user">
                        <User size={16} />
                        <span>{ticket.user.name}</span>
                        <span className="user-role">({ticket.user.role})</span>
                      </div>
                      <div className="ticket-date">
                        <Calendar size={16} />
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-card-footer">
                    <div className="ticket-actions">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTicketDetail = () => (
    <div className="ticket-detail-view">
      <div className="ticket-detail-header">
        <button className="back-btn" onClick={handleBackToList}>
          <ArrowLeft size={18} />
          Back to Tickets
        </button>
        <div className="ticket-detail-title">
          <h2>Ticket #{selectedTicket.id}</h2>
          <div className="ticket-detail-status">
            {getStatusIcon(selectedTicket.status)}
            <span>{selectedTicket.status.replace('_', ' ')}</span>
            <div className="priority-badge" style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }}>
              {selectedTicket.priority}
            </div>
          </div>
        </div>
      </div>

      <div className="ticket-detail-content">
        <div className="ticket-info-panel">
          <div className="ticket-info-card">
            <h3>Ticket Information</h3>
            <div className="info-row">
              <span className="info-label">Subject:</span>
              <span className="info-value">{selectedTicket.subject}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                className="status-select"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="info-row">
              <span className="info-label">Priority:</span>
              <span className="info-value">{selectedTicket.priority}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Type:</span>
              <span className="info-value">{selectedTicket.type}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Created:</span>
              <span className="info-value">{formatDate(selectedTicket.created_at)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Updated:</span>
              <span className="info-value">{formatDate(selectedTicket.updated_at)}</span>
            </div>
          </div>

          <div className="user-info-card">
            <h3>Customer Information</h3>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{selectedTicket.user.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{selectedTicket.user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">{selectedTicket.user.role}</span>
            </div>
          </div>
        </div>

        <div className="conversation-panel">
          <h3>Conversation</h3>
          <div className="messages-container">
            {selectedTicket.messages.map(message => (
              <div key={message.id} className={`message ${message.sender_type}`}>
                <div className="message-header">
                  <div className="message-sender">
                    <User size={16} />
                    <span>{message.sender}</span>
                    <span className="sender-type">({message.sender_type})</span>
                  </div>
                  <div className="message-time">
                    {formatDate(message.created_at)}
                  </div>
                </div>
                <div className="message-content">
                  {message.message}
                </div>
                {message.attachments.length > 0 && (
                  <div className="message-attachments">
                    {message.attachments.map((attachment, index) => (
                      <div key={index} className="attachment">
                        <Paperclip size={16} />
                        <span>{attachment.name}</span>
                        <button className="download-btn">
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="reply-section">
            <h4>Send Reply</h4>
            <div className="reply-form">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows="4"
              />
              <div className="reply-actions">
                <div className="file-upload">
                  <input
                    type="file"
                    id="attachment"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="attachment" className="file-upload-btn">
                    <Paperclip size={16} />
                    Attach File
                  </label>
                  {selectedFile && (
                    <span className="selected-file">{selectedFile.name}</span>
                  )}
                </div>
                <button 
                  className="send-reply-btn"
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() && !selectedFile}
                >
                  <Send size={16} />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ticket-system">
      {activeView === 'list' ? renderTicketList() : renderTicketDetail()}
    </div>
  );
};

export default TicketSystem;