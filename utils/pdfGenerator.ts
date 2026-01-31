import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

type BillData = {
    shopName: string;
    userName: string;
    billNumber: string;
    date: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    grandTotal: number;
};

export const generateBillPDF = async (data: BillData) => {
    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .shop-name { font-size: 24px; font-weight: bold; }
          .bill-info { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 2px solid #000; padding: 10px 5px; }
          td { padding: 10px 5px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${data.shopName}</div>
          <div>விற்பனை ரசீது</div>
        </div>
        
        <div class="bill-info">
          <div><b>பில் எண்:</b> ${data.billNumber}</div>
          <div><b>தேதி:</b> ${data.date}</div>
          <div><b>பயனர்:</b> ${data.userName}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>பொருள்</th>
              <th>அளவு</th>
              <th>விலை</th>
              <th>மொத்தம்</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity} kg</td>
                <td>₹${item.price}</td>
                <td>₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-row">
          மொத்த தொகை: ₹${data.grandTotal}
        </div>

        <div class="footer">
          நன்றி! மீண்டும் வருக!
        </div>
      </body>
    </html>
  `;

    try {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('File has been saved to:', uri);
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
};
