import React, { useState } from "react";
import "./Payslip.css";

interface PayslipProps {
    month: string;
    taxYear: string;
    grossPay: number;
    taxDeductions: number;
    netPay: number;
}

export default function Payslips() {
    const payslips: PayslipProps[] = [
        { month: "April 2026", taxYear: "2026/2027", grossPay: 2850, taxDeductions: 608, netPay: 2242 },
        { month: "March 2026", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 609, netPay: 2241 },
        { month: "February 2026", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 610, netPay: 2240 },
        { month: "January 2026", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 611, netPay: 2239 },
        { month: "December 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 612, netPay: 2238 },
        { month: "November 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 613, netPay: 2237 },
        { month: "October 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 614, netPay: 2236 },
        { month: "September 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 615, netPay: 2235 },
        { month: "August 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 616, netPay: 2234 },
        { month: "July 2025", taxYear: "2025/2026", grossPay: 2850, taxDeductions: 617, netPay: 2233 },
];

    const [filtermonth, setFilterMonth] = useState<number>(12);
    const filteredPayslips = payslips.slice(0, filtermonth);
    
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
                            <td>{p.month}</td>
                            <td>{p.taxYear}</td>
                            <td>£{p.grossPay.toFixed(2)}</td>
                            <td>£{p.taxDeductions.toFixed(2)}</td>
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



    
