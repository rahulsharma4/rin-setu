// Utility functions to generate and print official agreements and payment receipts
// using native browser print (HTML-to-PDF). Saves client bandwidth and renders perfectly.

export function printLoanAgreement(loan, borrower, lender) {
  const businessName = lender?.businessName || 'RinSetu Finance';
  const lenderName = lender?.name || 'Authorized Lender';
  const lenderPhone = lender?.phone || '';
  const borrowerName = borrower?.name || 'Valued Customer';
  const borrowerPhone = borrower?.phone || '';
  const borrowerAddress = borrower?.address || 'Not Provided';
  
  const agreementHTML = `
    <html>
      <head>
        <title>Loan Agreement - ${borrowerName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            background-color: #ffffff;
            line-height: 1.6;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .header {
            text-align: center;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 24px;
            margin-bottom: 30px;
          }
          .org-name {
            font-size: 26px;
            font-weight: 800;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-type {
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .meta-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 12px;
          }
          .card-title {
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            margin-bottom: 10px;
            font-size: 11px;
            letter-spacing: 1px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .info-label {
            color: #64748b;
            font-weight: 500;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }
          .terms-section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 14px;
            border-left: 4px solid #4f46e5;
            padding-left: 10px;
          }
          .terms-list {
            padding-left: 20px;
            font-size: 13px;
            color: #334155;
          }
          .terms-list li {
            margin-bottom: 10px;
          }
          .sign-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 50px;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px dashed #cbd5e1;
            text-align: center;
          }
          .sign-line {
            margin-top: 50px;
            border-top: 1px solid #475569;
            padding-top: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
          }
          .stamp-box {
            width: 100px;
            height: 100px;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
          }
          @media print {
            body { padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="org-name">${businessName}</div>
            <div class="doc-type">OFFICIAL LOAN AGREEMENT</div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-card">
              <div class="card-title">Lender Details</div>
              <div class="info-row"><span class="info-label">Name:</span> <span class="info-val">${lenderName}</span></div>
              <div class="info-row"><span class="info-label">Phone:</span> <span class="info-val">${lenderPhone}</span></div>
              <div class="info-row"><span class="info-label">Business:</span> <span class="info-val">${businessName}</span></div>
            </div>
            
            <div class="meta-card">
              <div class="card-title">Borrower Details</div>
              <div class="info-row"><span class="info-label">Name:</span> <span class="info-val">${borrowerName}</span></div>
              <div class="info-row"><span class="info-label">Phone:</span> <span class="info-val">${borrowerPhone}</span></div>
              <div class="info-row"><span class="info-label">Address:</span> <span class="info-val">${borrowerAddress}</span></div>
            </div>
          </div>

          <div class="meta-card" style="margin-bottom: 30px;">
            <div class="card-title">Financial Particulars</div>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div class="info-row"><span class="info-label">Principal Amount:</span> <span class="info-val" style="color: #10b981;">₹${loan.principalAmount.toLocaleString('en-IN')}</span></div>
              <div class="info-row"><span class="info-label">Interest Rate:</span> <span class="info-val">${loan.interestRate}% (${loan.rateType})</span></div>
              <div class="info-row"><span class="info-label">Interest Type:</span> <span class="info-val">${loan.interestType === 'simple' ? 'Simple' : 'Compound'}</span></div>
              <div class="info-row"><span class="info-label">Payment Frequency:</span> <span class="info-val" style="text-transform: capitalize;">${loan.paymentFrequency}</span></div>
              <div class="info-row"><span class="info-label">Start Date:</span> <span class="info-val">${new Date(loan.startDate).toLocaleDateString('en-IN')}</span></div>
              <div class="info-row"><span class="info-label">Loan Status:</span> <span class="info-val" style="text-transform: uppercase; color: #4f46e5;">${loan.status}</span></div>
            </div>
          </div>

          <div class="terms-section">
            <div class="section-title">Terms & Conditions</div>
            <ol class="terms-list">
              <li>उधारकर्ता (Borrower) ऋणदाता (Lender) से प्राप्त की गई मूल राशि <strong>₹${loan.principalAmount.toLocaleString('en-IN')}</strong> को निर्धारित ब्याज दर <strong>${loan.interestRate}% प्रति ${loan.rateType === 'monthly' ? 'माह' : 'वर्ष'}</strong> के साथ चुकाने का वादा करता है।</li>
              <li>सभी किस्तें ऋण तालिका (Repayment Schedule) के अनुसार समय पर देय होंगी। विलंब से भुगतान करने पर ऋणदाता अतिरिक्त दंडात्मक शुल्क आरोपित कर सकता है।</li>
              <li>ऋणदाता को बिना पूर्व सूचना के ब्याज और बकाया राशि वसूलने के लिए उचित कानूनी कदम उठाने का अधिकार सुरक्षित है।</li>
              <li>यह अनुबंध दोनों पक्षों के बीच पूर्ण सहमति का प्रतिनिधित्व करता है और किसी भी लिखित संशोधन के बिना बदला नहीं जा सकता है।</li>
            </ol>
          </div>

          <div class="sign-grid">
            <div>
              <div class="stamp-box">Lender Stamp</div>
              <div class="sign-line">Signature of Lender / Representative</div>
            </div>
            <div>
              <div style="height: 100px;"></div>
              <div class="sign-line">Signature of Borrower</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(agreementHTML);
  printWindow.document.close();
}

export function printPaymentReceipt(tx, loan, borrower, lender) {
  const businessName = lender?.businessName || 'RinSetu Finance';
  const lenderName = lender?.name || 'Authorized Lender';
  const lenderPhone = lender?.phone || '';
  const borrowerName = borrower?.name || 'Valued Customer';
  const borrowerPhone = borrower?.phone || '';
  
  const receiptHTML = `
    <html>
      <head>
        <title>Payment Receipt - ${tx.razorpayPaymentId || 'Cash'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            background-color: #ffffff;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px dashed #cbd5e1;
            padding: 30px;
            border-radius: 16px;
            background-color: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .org-name {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
            text-transform: uppercase;
          }
          .doc-type {
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .receipt-id {
            font-size: 11px;
            color: #94a3b8;
            font-family: monospace;
            margin-top: 6px;
          }
          .meta-section {
            margin-bottom: 20px;
            font-size: 13px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
          }
          .info-label {
            color: #64748b;
            font-weight: 500;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }
          .amount-card {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 24px;
          }
          .amount-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #15803d;
            letter-spacing: 0.5px;
          }
          .amount-val {
            font-size: 32px;
            font-weight: 900;
            color: #166534;
            margin-top: 4px;
          }
          .footer-note {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin-top: 30px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="org-name">${businessName}</div>
            <div class="doc-type">TRANSACTION PAYMENT RECEIPT</div>
            <div class="receipt-id">TXID: ${tx._id || 'MANUAL_' + Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
          </div>

          <div class="amount-card">
            <div class="amount-title">Repayment Received</div>
            <div class="amount-val">₹${tx.amount.toLocaleString('en-IN')}</div>
          </div>
          
          <div class="meta-section">
            <div class="info-row"><span class="info-label">Received From:</span> <span class="info-val">${borrowerName}</span></div>
            <div class="info-row"><span class="info-label">Phone:</span> <span class="info-val">${borrowerPhone}</span></div>
            <div class="info-row"><span class="info-label">Payment Date:</span> <span class="info-val">${new Date(tx.paymentDate).toLocaleDateString('en-IN')}</span></div>
            <div class="info-row"><span class="info-label">Payment Mode:</span> <span class="info-val" style="text-transform: uppercase;">${tx.paymentMode}</span></div>
            <div class="info-row"><span class="info-label">Payment Type:</span> <span class="info-val" style="text-transform: capitalize;">${tx.paymentType} Only</span></div>
            <div class="info-row"><span class="info-label">Reference ID:</span> <span class="info-val">${tx.razorpayPaymentId || 'Manual Cash'}</span></div>
            ${tx.notes ? `<div class="info-row"><span class="info-label">Remarks:</span> <span class="info-val">${tx.notes}</span></div>` : ''}
          </div>

          <div class="footer-note">
            This is a computer-generated digital receipt. No physical signature required.<br/>
            Thank you for your prompt repayment!
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
}
