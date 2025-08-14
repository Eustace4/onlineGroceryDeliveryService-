import React, { useState, useEffect } from "react";

const VendorTicket = ({ token, selectedBusiness }) => {
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [error, setError] = useState("");

  // Fetch tickets (example API call)
  useEffect(() => {
    if (!selectedBusiness) return;
    fetch(`/api/tickets?businessId=${selectedBusiness.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch((err) => setError("Failed to load tickets"));
  }, [selectedBusiness, token]);

  const handleAddTicket = () => {
    if (!newTicket.subject || !newTicket.message) {
      setError("Subject and message are required.");
      return;
    }

    fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...newTicket, businessId: selectedBusiness.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTickets([...tickets, data]);
        setNewTicket({ subject: "", message: "" });
        setError("");
      })
      .catch(() => setError("Failed to create ticket."));
  };

  return (
    <div>
      <h2>Tickets</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Subject"
          value={newTicket.subject}
          onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
        />
        <textarea
          placeholder="Message"
          value={newTicket.message}
          onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
        />
        <button onClick={handleAddTicket}>Add Ticket</button>
      </div>

      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <strong>{ticket.subject}</strong>: {ticket.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VendorTicket;
