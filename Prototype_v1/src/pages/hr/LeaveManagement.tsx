// hr leave management view
// features visual calendar for approved leave and pending approval table

import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import ToastContainer, { useToasts } from "../../components/common/Toast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { LeaveStatus } from "../../models/enums";

// @ts-ignore
import "./LeaveManagement.css";

// @ts-ignore
import "./EmployeeDirectory.css"; 

export default function LeaveManagement() {
  const { currentUser } = useAuth();
  const { toasts, pushToast } = useToasts();
  const registry = getRegistry();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const pendingRequests = useMemo(() => {
    return registry.getPendingLeaveRequests();
  }, [registry, refreshKey]);

  const approvedLeaves = useMemo(() => {
    return registry.getAllLeaveRequests().filter(lr => lr.status === LeaveStatus.APPROVED);
  }, [registry, refreshKey]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleApprove = (id: string) => {
    if (registry.approveLeaveRequest(id, currentUser!.employeeID)) {
      setRefreshKey(k => k + 1);
      pushToast("leave request approved.", "success");
    }
  };

  const handleReject = (reason?: string) => {
    if (!rejectTarget || !reason) return;
    if (registry.rejectLeaveRequest(rejectTarget, reason, currentUser!.employeeID)) {
      setRefreshKey(k => k + 1);
      pushToast("leave request rejected.", "info");
    }
    setRejectTarget(null);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="leave-mgmt">
      <ToastContainer toasts={toasts} />
      
      {rejectTarget && (
        <ConfirmDialog
          title="Reject Leave Request"
          message="please provide a mandatory reason for rejecting this leave request."
          danger={true}
          confirmLabel="Reject"
          requireInput={true}
          inputPlaceholder="reason for rejection..."
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* visual leave calendar */}
      <div className="leave-cal">
        <div className="leave-cal__header">
          <h3 className="leave-cal__title">
            {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="leave-cal__nav">
            <button 
              className="btn btn--secondary btn--sm" 
              onClick={prevMonth}
            >
              Prev
            </button>
            <button 
              className="btn btn--secondary btn--sm" 
              onClick={nextMonth}
            >
              Next
            </button>
          </div>
        </div>
        
        <div className="leave-cal__grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div 
              key={d} 
              className="leave-cal__day-header"
            >
              {d}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="leave-cal__cell leave-cal__cell--empty" 
            />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const currentCellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === currentCellDate.toDateString();
            
            const leavesOnDay = approvedLeaves.filter(lr => {
              const start = new Date(lr.startDate);
              const end = new Date(lr.endDate);
              start.setHours(0,0,0,0);
              end.setHours(23,59,59,999);
              return currentCellDate >= start && currentCellDate <= end;
            });

            return (
              <div 
                key={day} 
                className={`leave-cal__cell ${isToday ? 'leave-cal__cell--today' : ''}`}
              >
                <span className="leave-cal__date">
                  {day}
                </span>
                
                {leavesOnDay.map(lr => {
                  const user = registry.getUserByID(lr.userID);
                  return (
                    <div 
                      key={lr.leaveRequestID} 
                      className="leave-cal__block" 
                      title={`${user?.firstName} ${user?.lastName} - ${lr.type}`}
                    >
                      {user?.firstName} {user?.lastName[0]}.
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* pending requests list */}
      <div>
        <h3 className="leave-mgmt__section-title">
          Pending Approvals
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="leave-mgmt__empty">
            no pending leave requests to review.
          </div>
        ) : (
          <div className="emp-dir__table-wrap">
            <table className="emp-dir__table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(lr => {
                  const user = registry.getUserByID(lr.userID);
                  return (
                    <tr 
                      key={lr.leaveRequestID} 
                      className="emp-dir__row"
                    >
                      <td>
                        <div className="emp-dir__full-name">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="emp-dir__email">
                          {user?.employeeID}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--neutral">
                          {lr.type}
                        </span>
                      </td>
                      <td>
                        <div className="leave-mgmt__date-range">
                          {new Date(lr.startDate).toLocaleDateString('en-GB')} - {new Date(lr.endDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td>
                        {lr.numberOfDays}
                      </td>
                      <td>
                        <div className="leave-mgmt__actions">
                          <button 
                            className="btn btn--success btn--sm" 
                            onClick={() => handleApprove(lr.leaveRequestID)}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn--danger btn--sm" 
                            onClick={() => setRejectTarget(lr.leaveRequestID)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}