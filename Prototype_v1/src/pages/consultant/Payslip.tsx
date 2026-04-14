import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext"; 
import { getRegistry } from "../../services/Registry";
import "./Payslip.css";

export default function Payslip() {
    const { currentUser } = useAuth(); /* Get the current user from the authentication context */
    const registry = getRegistry(); /* Get the registry service to access payslip data */

    const userpayslips = registry.getPayslipsForUser(currentUser?.employeeID || ""); /* Fetch payslips for the selected user */
    const sortedpayslips = userpayslips.sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()); /* Sort payslips by most recent first */

    const [filtermonth, setFilterMonth] = useState<number>(12); /* State to filter payslips by number of months */
    const filteredPayslips = sortedpayslips.slice(0, filtermonth); /* Get the most recent payslips based on the selected filter/no filter */
    
    const totalNet = filteredPayslips.reduce((sum, p) => sum + p.netPay, 0); /* Calculate total net pay for the displayed payslips */

    return (
        <div className="payslip-container">
            <h1>Payslips</h1>
            <div className="filter">
                <label htmlFor="monthFilter">Show last </label>
                <select id="monthFilter" value={filtermonth} onChange={e => setFilterMonth(Number(e.target.value))}> /* Dropdown to select number of months to display */
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
                    {filteredPayslips.map((p, index) => ( /* Display filtered payslips */
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



    
