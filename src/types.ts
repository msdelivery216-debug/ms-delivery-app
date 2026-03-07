export interface Client {
  id: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  clientId: string;
  clientName?: string;
  pickupLocation: string;
  customerName: string;
  dropLocation: string;
  mapPinUrl: string;
  customerContact: string;
  outsourceName: string;
  outsourceCharges: number;
  modeOfPayment: 'Cash On Pickup' | 'Cash On Delivery';
  deliveryCharges: number;
  units: number;
  remark: string;
}

export interface Profile {
  companyName: string;
  ownerName: string;
  contactEmail: string;
  logoUrl: string;
}

export type DateFilter = 'Today' | 'This Month' | 'Last 3 Months' | 'Last 6 Months' | 'Yearly' | 'Custom Range';
