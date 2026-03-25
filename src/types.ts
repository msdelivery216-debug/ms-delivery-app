export interface Client {
  id: number;
  clientName: string;
  clientAddress: string;
  clientContact: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  orderDate: string;
  clientId: number;
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
