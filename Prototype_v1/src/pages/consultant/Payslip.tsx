import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import "./Payslip.css";

export default function Payslip() {
    const { currentUser } = useAuth();
    const registry = getRegistry();

    const userpayslips = registry.getPayslipsForUser(currentUser?.employeeID || "");
    const sortedpayslips = userpayslips.sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime());

    const [filtermonth, setFilterMonth] = useState<number>(12);
    const filteredPayslips = sortedpayslips.slice(0, filtermonth);
    
    const totalNet = filteredPayslips.reduce((sum, p) => sum + p.netPay, 0);

    return (
        <div className="payslip-container">
            <h1>Payslips</h1>
            <div className="filter">
                <label htmlFor="monthFilter">Show last </label>
                <select id="monthFilter" value={filtermonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                </select>
            </div>
            <table className="payslip-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Tax Year</th>
                        <th>Gross Pay</th>
                        <th>Tax Deductions</th>
                        <th>Net Pay</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPayslips.map((p, index) => (
                        <tr key={index}>
                            <td>{p.payPeriod}</td>
                            <td>{p.taxYear}</td>
                            <td>£{p.grossPay.toFixed(2)}</td>
                            <td>£{p.deductions.toFixed(2)}</td>
                            <td>£{p.netPay.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="summary">
                <p>Total Net Pay: £{totalNet.toFixed(2)}</p>
            </div>
        </div>
    );
}



    
