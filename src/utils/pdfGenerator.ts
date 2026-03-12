import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

type BillData = {
  shopName: string;
  userName: string;
  billNumber: string;
  phone?: string;
  address?: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subTotal: number;
  discount?: number;
  grandTotal: number;
  logo?: string;
  language?: 'English' | 'Tamil';
};

export const generateBillPDF = async (data: BillData) => {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 10px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; }
          .shop-name { font-size: 26px; font-weight: 800; color: #000; margin-bottom: 5px; }
          .shop-address { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
          .shop-phone { font-size: 14px; font-weight: 700; }
          
          .bill-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
          .bill-info div { margin-bottom: 4px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; background-color: #fff; padding: 8px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #eee; }
          td { padding: 10px 8px; font-size: 14px; border-bottom: 0px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }

          .summary-table { width: 60%; margin-left: auto; margin-top: 10px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #000; }
          .total-row { border-top: 1.5px solid #000; padding-top: 10px; padding-bottom: 5px; margin-top: 10px; font-size: 20px; font-weight: 900; color: #000; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 14px; font-weight: 600; color: #000; border-top: 1px dashed #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${data.shopName}</div>
          <div class="shop-address">${data.address || (data.language === 'Tamil' ? 'பாண்டி - திண்டிவனம் மெயின் ரோடு, கிளியனூர்.' : 'Pondy - Tindivanam Main Road, Kiliyanur.')}</div>
          <div class="shop-phone">${data.language === 'Tamil' ? 'தொலைபேசி' : 'Phone'}: ${data.phone || '9095938085'}</div>
        </div>
        
        <div class="bill-meta">
          <div class="bill-info">
            <div><b>${data.language === 'Tamil' ? 'தேதி' : 'Date'}:</b> ${data.date}</div>
            <div><b>${data.language === 'Tamil' ? 'ரசீது எண்' : 'Bill No'}:</b> ${data.billNumber}</div>
          </div>
          <div class="customer-info" style="text-align: right;">
             <div><b>${data.language === 'Tamil' ? 'வாடிக்கையாளர்' : 'Customer'}:</b> ${data.userName}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${data.language === 'Tamil' ? 'பொருள்' : 'ITEM'}</th>
              <th class="text-center">${data.language === 'Tamil' ? 'அளவு' : 'QTY'}</th>
              <th class="text-right">${data.language === 'Tamil' ? 'விலை' : 'PRICE'}</th>
              <th class="text-right">${data.language === 'Tamil' ? 'மொத்தம்' : 'TOTAL'}</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td><b>${item.name}</b></td>
                <td class="text-center">${item.quantity} kg</td>
                <td class="text-right">₹${item.price}</td>
                <td class="text-right">₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-table">
          <div class="summary-row">
            <span>${data.language === 'Tamil' ? 'கூட்டுத் தொகை' : 'Sub-Total'}:</span>
            <span>₹${data.subTotal.toFixed(2)}</span>
          </div>
          ${data.discount ? `
          <div class="summary-row">
            <span>${data.language === 'Tamil' ? 'தள்ளுபடி' : 'Discount'}:</span>
            <span>- ₹${data.discount.toFixed(2)}</span>
          </div>` : ''}
          <div class="summary-row total-row">
            <span>${data.language === 'Tamil' ? 'மொத்தம்' : 'GRAND TOTAL'}:</span>
            <span>₹${data.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          ${data.language === 'Tamil' ? 'நன்றி! மீண்டும் வருக!' : 'Thank You! Visit Again!'}
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
