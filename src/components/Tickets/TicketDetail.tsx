import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI } from '../../services/api';
import { Ticket as TicketType } from '../../types';
import { TicketComment } from '../../types';
import { X, MessageCircle, Edit, User } from 'lucide-react';

interface TicketDetailProps {
  ticket: TicketType;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onClose }) => {
  const { updateTicket, addTicketComment, users, equipment } = useApp();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to?.toString() || '');
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const response = await ticketsAPI.getComments(ticket.id.toString());
      setComments(response.data);
    } catch (error) {
      console.error('Load comments error:', error);
    }
  }, [ticket.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const creator = users.find(u => u.id === ticket.created_by);
  const assignee = users.find(u => u.id === ticket.assigned_to);
  const relatedEquipment = ticket.equipment_id ? equipment.find(e => e.id === ticket.equipment_id) : null;

  const canManageTicket = user?.role === 'admin' || user?.role === 'it_personnel';
  const isCreator = user?.id === ticket.created_by;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setLoading(true);
    addTicketComment(ticket.id, comment).then(() => {
      loadComments();
      setLoading(false);
    });
    setComment('');
  };

  const handleStatusChange = () => {
    const updates: Partial<TicketType> = { status };
    if (assignedTo !== ticket.assigned_to?.toString()) {
      updates.assigned_to = assignedTo ? parseInt(assignedTo) : undefined;
    }
    updateTicket(ticket.id, updates);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'bg-blue-100 text-blue-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Résolu': return 'bg-green-100 text-green-800';
      case 'Fermé': return 'bg-gray-100 text-gray-800';
      case 'Escaladé': return 'bg-red-100 text-red-800';
      case 'En attente': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800';
      case 'Haute': return 'bg-orange-100 text-orange-800';
      case 'Normale': return 'bg-blue-100 text-blue-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ticketStatuses = ['Ouvert', 'En cours', 'Résolu', 'Fermé', 'Escaladé', 'En attente'];
  const itPersonnel = users.filter(u => u.role === 'admin' || u.role === 'it_personnel');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="industrial-card">
        <div className="flex justify-between items-center p-3 border-b border-black">
          <h2 className="text-sm font-bold text-black font-mono uppercase tracking-wider">
            Ticket #{ticket.id.toString().padStart(6, '0')}
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:text-orange-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-sm font-bold text-black font-mono">{ticket.title}</h1>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-black text-xs font-mono whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Equipment Info */}
              {relatedEquipment && (
                <div className="mb-4 p-2 bg-gray-100 border border-black">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-black mb-1">Equipment</h3>
                  <div className="text-xs text-black font-mono">
                    <p><strong>{relatedEquipment.name}</strong></p>
                    <p>{relatedEquipment.brand} {relatedEquipment.model}</p>
                    <p>SN: {relatedEquipment.serial_number}</p>
                    <p>Emplacement: {relatedEquipment.location}</p>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-black mb-2">Comments</h3>
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-2 bg-gray-100 border border-black">
                      <div className="flex items-center space-x-1 mb-1">
                        <User className="h-3 w-3 text-black" />
                        <span className="text-xs font-mono text-black">{comment.author_name}</span>
                        <span className="text-xs text-black">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(comment.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-black text-xs font-mono whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="mt-2">
                  <textarea
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
                    className="industrial-input w-full px-2 py-1"
                    autoComplete="off"
                  />
                  <div className="mt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={!comment.trim() || loading}
                      className="industrial-button-orange px-2 py-1 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Comment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Ticket Info */}
              <div className="bg-gray-100 p-2 border border-black">
                <h3 className="text-xs font-mono uppercase tracking-wider text-black mb-2">Info</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div>
                    <span className="text-black">Type:</span>
                    <span className="ml-1 font-bold">{ticket.type}</span>
                  </div>
                  <div>
                    <span className="text-black">Created by:</span>
                    <span className="ml-1 font-bold">{creator?.name || 'Unknown'}</span>
                  </div>
                  {assignee && (
                    <div>
                      <span className="text-black">Assigned:</span>
                      <span className="ml-1 font-bold">{assignee.name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-black">Created:</span>
                    <span className="ml-1 font-bold">
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Updated:</span>
                    <span className="ml-1 font-bold">
                      {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              {isCreator && (
                <div className="bg-blue-50 p-2 border border-blue-200">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-blue-800 mb-2">Creator Info</h3>
                  <div className="text-xs text-blue-700 font-mono">
                    <p>You created this ticket</p>
                    <p className="text-blue-600">You can track its progress here</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {canManageTicket && (
                <div className="bg-gray-100 p-2 border border-black">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-black mb-2">Actions</h3>
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="status" className="block text-xs font-mono text-black mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TicketType['status'])}
                        className="industrial-select w-full px-1 py-1"
                        autoComplete="off"
                      >
                        {ticketStatuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="assignedTo" className="block text-xs font-mono text-black mb-1">
                        Assign to
                      </label>
                      <select
                        id="assignedTo"
                        name="assignedTo"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="industrial-select w-full px-1 py-1"
                        autoComplete="off"
                      >
                        <option value="">Unassigned</option>
                        {itPersonnel.map(person => (
                          <option key={person.id} value={person.id}>{person.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleStatusChange}
                      className="industrial-button-orange w-full px-2 py-1 flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;