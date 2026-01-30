// Auto-accept best bid when bidding time expires

import { Order, Bid, ShippingBid } from './types';
import { updateBid, updateShippingBid, updateOrder } from './api-client';

/**
 * Calculate bid end time based on order creation and bid running time
 */
export function calculateBidEndTime(order: Order): Date {
  const createdAt = new Date(order.createdAt);
  const bidRunningDays = 7; // Default 7 days if not specified

  const specs = order.item?.specifications as any;
  const specifiedDays = specs?.['Seller Bid Running Time (days)'] || specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
  const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

  const endTime = new Date(createdAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return endTime;
}

/**
 * Check if bid time has expired
 */
export function isBidExpired(order: Order): boolean {
  const endTime = calculateBidEndTime(order);
  return new Date() > endTime;
}

/**
 * Calculate shipping bid end time based on when order was accepted (seller bid accepted)
 * and shipping bid running time from specifications
 */
export function calculateShippingBidEndTime(order: Order): Date {
  // Shipping bidding starts when order status becomes 'accepted' (seller bid accepted)
  const acceptedAt = new Date(order.updatedAt);
  const bidRunningDays = 7; // Default 7 days if not specified

  const specs = order.item?.specifications as any;
  // Use SHIPPING bid running time, not seller bid running time
  const specifiedDays = specs?.['Shipping Bid Running Time (days)'] || specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
  const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

  const endTime = new Date(acceptedAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return endTime;
}

/**
 * Check if shipping bid time has expired
 */
export function isShippingBidExpired(order: Order): boolean {
  const endTime = calculateShippingBidEndTime(order);
  return new Date() > endTime;
}

/**
 * Auto-accept best seller bid when time expires
 * @returns true if bid was auto-accepted, false otherwise
 */
export async function autoAcceptSellerBid(
  order: Order,
  bids: Bid[]
): Promise<boolean> {
  // Check if bid time has expired
  if (!isBidExpired(order)) {
    return false;
  }

  // Check if order is still pending
  if (order.status !== 'pending') {
    return false;
  }

  // Get pending bids for this order
  const pendingBids = bids.filter(b =>
    b.orderId === order.id && b.status === 'pending'
  );

  console.log('Auto-accept check:', {
    orderId: order.id,
    totalBids: bids.length,
    pendingBidsCount: pendingBids.length,
    pendingBidsData: pendingBids.map(b => ({
      id: b.id,
      bidAmount: b.bidAmount,
      status: b.status,
      sellerId: b.sellerId
    }))
  });

  if (pendingBids.length === 0) {
    // No bids to accept, mark order as rejected
    console.log('No pending bids found, marking order as rejected');
    await updateOrder(order.id, { status: 'rejected' });
    return false;
  }

  // Validate that all bids have proper IDs
  const invalidBids = pendingBids.filter(b => !b.id || typeof b.id !== 'string');
  if (invalidBids.length > 0) {
    console.error('Found bids with invalid IDs:', invalidBids);
    return false;
  }

  // Find the lowest bid (best price for buyer)
  const lowestBid = pendingBids.reduce((lowest, bid) =>
    bid.bidAmount < lowest.bidAmount ? bid : lowest
  );

  console.log('Auto-accepting seller bid:', {
    bidId: lowestBid.id,
    orderId: order.id,
    bidAmount: lowestBid.bidAmount,
    totalPendingBids: pendingBids.length
  });

  try {
    // Accept the lowest bid
    console.log('Step 1: Accepting lowest bid...');
    await updateBid(lowestBid.id, { status: 'accepted' });
    console.log('Step 1: Lowest bid accepted successfully');

    // Reject all other bids
    const otherBids = pendingBids.filter(b => b.id !== lowestBid.id);
    console.log(`Step 2: Rejecting ${otherBids.length} other bids...`);
    await Promise.all(
      otherBids.map(bid => updateBid(bid.id, { status: 'rejected' }))
    );
    console.log('Step 2: Other bids rejected successfully');

    // Update order status to accepted
    console.log('Step 3: Updating order status...');
    await updateOrder(order.id, { status: 'accepted' });
    console.log('Step 3: Order status updated successfully');

    return true;
  } catch (error) {
    console.error('Error auto-accepting seller bid:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      bidId: lowestBid.id,
      orderId: order.id
    });
    return false;
  }
}

/**
 * Auto-accept best shipping bid when time expires
 * @returns true if bid was auto-accepted, false otherwise
 */
export async function autoAcceptShippingBid(
  order: Order,
  shippingBids: ShippingBid[]
): Promise<boolean> {
  // Check if SHIPPING bid time has expired (not seller bid time)
  if (!isShippingBidExpired(order)) {
    return false;
  }

  // Check if order is accepted (seller chosen, ready for shipping)
  if (order.status !== 'accepted') {
    return false;
  }

  // Get pending shipping bids for this order
  const pendingShippingBids = shippingBids.filter(sb =>
    sb.orderId === order.id && sb.status === 'pending'
  );

  if (pendingShippingBids.length === 0) {
    // No shipping bids available
    return false;
  }

  // Find the lowest shipping bid (best price for buyer)
  const lowestShippingBid = pendingShippingBids.reduce((lowest, bid) =>
    bid.bidAmount < lowest.bidAmount ? bid : lowest
  );

  console.log(`Auto-accepting shipping bid ${lowestShippingBid.id} for order ${order.id}`);

  try {
    // Accept the lowest shipping bid
    await updateShippingBid(lowestShippingBid.id, { status: 'accepted' });

    // Reject all other shipping bids
    const otherBids = pendingShippingBids.filter(sb => sb.id !== lowestShippingBid.id);
    await Promise.all(
      otherBids.map(bid => updateShippingBid(bid.id, { status: 'rejected' }))
    );

    // Update order status to completed (both seller and shipping chosen)
    await updateOrder(order.id, { status: 'completed' });

    return true;
  } catch (error) {
    console.error('Error auto-accepting shipping bid:', error);
    return false;
  }
}

/**
 * Process auto-accept for all expired orders
 * Should be called periodically in buyer dashboard
 */
export async function processAutoAccepts(
  orders: Order[],
  bids: Bid[],
  shippingBids: ShippingBid[]
): Promise<{ sellerAccepted: number; shippingAccepted: number }> {
  let sellerAccepted = 0;
  let shippingAccepted = 0;

  for (const order of orders) {
    if (!isBidExpired(order)) continue;

    // Try to auto-accept seller bid
    if (order.status === 'pending') {
      const accepted = await autoAcceptSellerBid(order, bids);
      if (accepted) sellerAccepted++;
    }

    // Try to auto-accept shipping bid
    if (order.status === 'accepted') {
      const accepted = await autoAcceptShippingBid(order, shippingBids);
      if (accepted) shippingAccepted++;
    }
  }

  return { sellerAccepted, shippingAccepted };
}

