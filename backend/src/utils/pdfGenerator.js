import puppeteer from 'puppeteer';

export async function generateElectionResultsPDF(election, results) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Generate HTML content for the PDF
    const htmlContent = generateHTMLContent(election, results);
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: false
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateHTMLContent(election, results) {
  const totalVotes = results.reduce((sum, result) => sum + result.count, 0);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Election Results - ${election.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
                 body {
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           line-height: 1.6;
           color: #333;
           background: white;
           margin: 0;
           padding: 0;
         }
        
                 .container {
           max-width: 800px;
           margin: 0 auto;
           background: white;
           border-radius: 20px;
           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
           overflow: hidden;
           page-break-inside: avoid;
         }
         
         .title-page {
           min-height: 100vh;
           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
           display: flex;
           flex-direction: column;
           justify-content: center;
           align-items: center;
           text-align: center;
           color: white;
           padding: 40px;
           page-break-after: always;
         }
         
         .title-header {
           margin-bottom: 60px;
         }
         
         .election-title-box {
           background: rgba(255, 255, 255, 0.9);
           padding: 30px;
           border-radius: 15px;
           margin-bottom: 40px;
           max-width: 600px;
         }
         
         .election-title {
           color: #2d3748;
           font-size: 24px;
           font-weight: 700;
           margin: 0;
         }
         
         .election-details-title {
           margin-bottom: 60px;
         }
         
         .election-period, .election-status {
           font-size: 16px;
           margin: 10px 0;
           opacity: 0.9;
         }
         
         .title-footer {
           position: absolute;
           bottom: 40px;
           left: 50%;
           transform: translateX(-50%);
           font-size: 14px;
           opacity: 0.8;
         }
         
         .results-page {
           min-height: 100vh;
           background: white;
         }
         
         .results-header {
           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
           color: white;
           padding: 20px;
           text-align: center;
         }
         
         .results-title {
           font-size: 20px;
           font-weight: 700;
           margin: 0;
         }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
          font-size: 18px;
          opacity: 0.9;
          font-weight: 300;
        }
        
        .content {
          padding: 40px;
        }
        
        .election-info {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          border-left: 5px solid #667eea;
        }
        
        .election-title {
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 15px;
        }
        
        .election-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .detail-value {
          font-size: 16px;
          font-weight: 500;
          color: #2d3748;
        }
        
        .results-section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        }
        
        .section-title::before {
          content: '📊';
          margin-right: 10px;
          font-size: 24px;
        }
        
        .total-votes {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          margin-bottom: 25px;
        }
        
        .total-votes-number {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .total-votes-label {
          font-size: 14px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .results-table th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .results-table td {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 16px;
        }
        
        .results-table tr:last-child td {
          border-bottom: none;
        }
        
        .results-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .candidate-name {
          font-weight: 600;
          color: #2d3748;
        }
        
        .vote-count {
          font-weight: 600;
          color: #667eea;
        }
        
        .percentage {
          font-weight: 500;
          color: #718096;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .winner-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: 10px;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
          color: #718096;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .generated-date {
          color: #a0aec0;
          font-size: 12px;
        }
        
        .security-note {
          background: #e6fffa;
          border: 1px solid #81e6d9;
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .security-note-text {
          color: #234e52;
          font-size: 12px;
          text-align: center;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
                 <!-- Title Page -->
         <div class="title-page">
           <div class="title-header">
             <div class="logo">🗳️</div>
             <h1 class="title">eVoting System</h1>
             <p class="subtitle">Official Results Report</p>
           </div>
           
           <div class="election-title-box">
             <h2 class="election-title">${election.title}</h2>
           </div>
           
           <div class="election-details-title">
             <p class="election-period">Election Period: ${new Date(election.startTime).toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
             })} - ${new Date(election.endTime).toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
             })}</p>
             <p class="election-status">Status: ${election.status.toUpperCase()}</p>
           </div>
           
           <div class="title-footer">
             <p>This document contains official election results</p>
             <p>Generated by eVoting System</p>
           </div>
         </div>
         
         <!-- Results Page -->
         <div class="results-page">
           <div class="results-header">
             <h2 class="results-title">📊 ELECTION RESULTS</h2>
           </div>
           
           <div class="content">
          
          <div class="results-section">
            <h3 class="section-title">Voting Results</h3>
            
            <div class="total-votes">
              <div class="total-votes-number">${totalVotes}</div>
              <div class="total-votes-label">Total Votes Cast</div>
            </div>
            
            <table class="results-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Votes</th>
                  <th>Percentage</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${results.map((result, index) => {
                  const percentage = totalVotes > 0 ? ((result.count / totalVotes) * 100).toFixed(1) : 0;
                  const isWinner = index === 0 && result.count > 0;
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="candidate-name">
                        ${result.candidate}
                        ${isWinner ? '<span class="winner-badge">Winner</span>' : ''}
                      </td>
                      <td class="vote-count">${result.count}</td>
                      <td class="percentage">${percentage}%</td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
                 </div>
         
         <div class="footer">
           <p class="footer-text">This is an official document generated by the eVoting System</p>
           <p class="generated-date">Generated on: ${currentDate}</p>
           
           <div class="security-note">
             <p class="security-note-text">
               🔒 This document contains sensitive voting information and should be handled securely.
               All votes are encrypted and verified through our secure voting system.
             </p>
           </div>
         </div>
         </div>
       </div>
    </body>
    </html>
  `;
}
