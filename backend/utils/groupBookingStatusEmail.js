import { sendEmail } from './sendEmail.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const statusLabels = {
  on_hold: 'on hold',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
};

const getPassengerFare = (booking, passenger) => {
  if (
    passenger.type === 'infant'
    && (booking.infantPriceOnCall || booking.ticketDetails?.infantPriceOnCall)
  ) return 'On call';
  const fare = booking.ticketDetails?.[`${passenger.type}Fare`];
  return Number.isFinite(Number(fare)) ? Number(fare).toLocaleString('en-US') : 'Not available';
};

export const sendGroupBookingStatusEmail = async (booking, status, { automaticCancellation = false } = {}) => {
  try {
    const statusLabel = statusLabels[status];
    if (!statusLabel) throw new Error(`Unsupported group booking email status: ${status}`);

    const user = booking.user;
    const companyName = 'Foreign Air Travel';
    const recipientName = user?.name || 'Customer';
    const invoicePath = `/dashboard/bookings?invoice=${encodeURIComponent(String(booking._id))}`;
    const invoiceUrl = `https://www.foreignairtravel.com/login?returnTo=${encodeURIComponent(invoicePath)}`;
    const description = status === 'on_hold'
      ? 'Your group ticket booking is on hold for up to 2 hours while it awaits confirmation.'
      : status === 'confirmed'
        ? 'Your group ticket booking has been confirmed.'
        : automaticCancellation
          ? 'Your group ticket booking was automatically cancelled because it was not confirmed within 2 hours.'
          : 'Your group ticket booking has been cancelled by the administrator.';
    const passengerRows = (booking.passengers || []).map((passenger) => {
      const name = [passenger.title, passenger.firstName, passenger.lastName].filter(Boolean).join(' ');
      return `
        <tr>
          <td style="border:1px solid #111;padding:9px;color:#707983">${escapeHtml(name)}</td>
          <td style="border:1px solid #111;padding:9px;text-align:center;color:#707983">${escapeHtml(String(passenger.type || '').toUpperCase())}</td>
          <td style="border:1px solid #111;padding:9px;text-align:center;color:#707983">${escapeHtml(getPassengerFare(booking, passenger))}</td>
          <td style="border:1px solid #111;padding:9px;text-align:center;color:#707983">${escapeHtml(passenger.passportNumber)}</td>
        </tr>`;
    }).join('');

    await sendEmail({
      to: user?.email,
      subject: `Booking Status: ${statusLabel}`,
      html: `
        <div style="margin:0;background:#edf3f7;padding:24px 12px;font-family:Arial,sans-serif;color:#414b55">
          <div style="max-width:950px;margin:0 auto">
            <h2 style="margin:4px 0 26px;text-align:center;font-size:18px;color:#003366">${escapeHtml(companyName)}</h2>
            <div style="background:#fff;padding:30px 32px">
              <h3 style="margin:0 0 14px;font-size:17px;color:#003366">Hello ${escapeHtml(recipientName)}!</h3>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#78828d">${escapeHtml(description)} You can view your invoice using the button below.</p>
              <h3 style="margin:0 0 28px;font-size:17px;color:#003366">Passengers Detail</h3>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                  <tr style="color:#003366;text-align:left">
                    <th style="border:1px solid #111;padding:6px">Name</th>
                    <th style="border:1px solid #111;padding:6px">Type</th>
                    <th style="border:1px solid #111;padding:6px">Fares</th>
                    <th style="border:1px solid #111;padding:6px">Passport</th>
                  </tr>
                </thead>
                <tbody>${passengerRows}</tbody>
              </table>
              <div style="margin:30px 0;text-align:center">
                <a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;border-radius:4px;background:#003366;padding:11px 20px;color:#fff;text-decoration:none;font-size:14px">View Invoice</a>
              </div>
              <p style="margin:24px 0 0;color:#78828d">Thank you for doing business with us!</p>
              <p style="margin:20px 0 0;color:#78828d">Regards,<br>Foreign Air Travel</p>
              <hr style="margin:24px 0;border:0;border-top:1px solid #e1e5e9">
              <p style="margin:0;color:#78828d;font-size:13px;line-height:1.6">If the button does not work, copy and paste this URL into your browser: <a href="${escapeHtml(invoiceUrl)}" style="color:#1767bd;word-break:break-all">${escapeHtml(invoiceUrl)}</a></p>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Group booking status email failed:', {
      bookingId: String(booking?._id || ''),
      status,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    });
    return false;
  }
};
