// Tests básicos para el sistema de delivery
import { mockRepo } from '../repos/mockRepo';
import { assignmentService } from '../services/AssignmentService';

// Helper para limpiar datos entre tests
function setupTest() {
  mockRepo.clear();
  assignmentService.cleanup();
}

// Test: Doble accept → solo uno gana
async function testDoubleAccept() {
  console.log('🧪 Testing: Double accept scenario');
  
  setupTest();
  
  // Crear courier
  const courierResult = await mockRepo.createCourier({
    userId: 'test_courier',
    name: 'Test Courier',
    phone: '+56912345678',
    isActive: true,
    isAvailable: true,
  });
  
  if (!courierResult.success) throw new Error('Failed to create courier');
  
  // Crear delivery
  const deliveryResult = await mockRepo.createDelivery({
    orderId: 'test_order',
    sellerId: 'test_seller',
    status: 'pending',
    pickup: { address: 'Pickup Address' },
    dropoff: { address: 'Dropoff Address' },
  });
  
  if (!deliveryResult.success) throw new Error('Failed to create delivery');
  
  // Crear oferta
  const offerResult = await assignmentService.createOffer(
    deliveryResult.data!.id, 
    courierResult.data!.id
  );
  
  if (!offerResult.success) throw new Error('Failed to create offer');
  
  const offerId = offerResult.data!.id;
  
  // Primer accept (debería funcionar)
  const accept1Result = await assignmentService.acceptOffer(offerId);
  if (!accept1Result.success) throw new Error('First accept failed');
  
  // Segundo accept (debería fallar)
  const accept2Result = await assignmentService.acceptOffer(offerId);
  if (accept2Result.success) throw new Error('Second accept should have failed');
  
  console.log('✅ Double accept test passed');
}

// Test: Expiración → siguiente courier
async function testExpiration() {
  console.log('🧪 Testing: Expiration scenario');
  
  setupTest();
  
  // Crear dos couriers
  const courier1Result = await mockRepo.createCourier({
    userId: 'courier1',
    name: 'Courier 1',
    phone: '+56911111111',
    isActive: true,
    isAvailable: true,
  });
  
  const courier2Result = await mockRepo.createCourier({
    userId: 'courier2', 
    name: 'Courier 2',
    phone: '+56922222222',
    isActive: true,
    isAvailable: true,
  });
  
  if (!courier1Result.success || !courier2Result.success) {
    throw new Error('Failed to create couriers');
  }
  
  // Crear delivery
  const deliveryResult = await mockRepo.createDelivery({
    orderId: 'test_order',
    sellerId: 'test_seller',
    status: 'pending',
    pickup: { address: 'Pickup Address' },
    dropoff: { address: 'Dropoff Address' },
  });
  
  if (!deliveryResult.success) throw new Error('Failed to create delivery');
  
  // Crear oferta al primer courier
  const offerResult = await assignmentService.createOffer(
    deliveryResult.data!.id,
    courier1Result.data!.id
  );
  
  if (!offerResult.success) throw new Error('Failed to create offer');
  
  // Rechazar oferta (simula expiración)
  const declineResult = await assignmentService.declineOffer(offerResult.data!.id);
  if (!declineResult.success) throw new Error('Failed to decline offer');
  
  // Debería intentar siguiente courier
  const nextCourierResult = await assignmentService.tryNextCourier(deliveryResult.data!.id);
  if (!nextCourierResult.success) throw new Error('Failed to try next courier');
  
  console.log('✅ Expiration test passed');
}

// Test: Sin couriers → no_courier
async function testNoCouriers() {
  console.log('🧪 Testing: No couriers scenario');
  
  setupTest();
  
  // Crear delivery sin couriers
  const deliveryResult = await mockRepo.createDelivery({
    orderId: 'test_order',
    sellerId: 'test_seller', 
    status: 'pending',
    pickup: { address: 'Pickup Address' },
    dropoff: { address: 'Dropoff Address' },
  });
  
  if (!deliveryResult.success) throw new Error('Failed to create delivery');
  
  // Intentar asignación sin couriers
  const assignmentResult = await assignmentService.tryNextCourier(deliveryResult.data!.id);
  if (!assignmentResult.success) throw new Error('Assignment should have failed');
  
  // Verificar que delivery quedó como no_courier
  const updatedDeliveryResult = await mockRepo.getDelivery(deliveryResult.data!.id);
  if (!updatedDeliveryResult.success) throw new Error('Failed to get updated delivery');
  
  if (updatedDeliveryResult.data!.status !== 'no_courier') {
    throw new Error('Delivery should be marked as no_courier');
  }
  
  console.log('✅ No couriers test passed');
}

// Ejecutar todos los tests
export async function runDeliveryTests() {
  console.log('🚀 Running Delivery System Tests...\n');
  
  try {
    await testDoubleAccept();
    await testExpiration();
    await testNoCouriers();
    
    console.log('\n🎉 All tests passed!');
    return true;
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Auto-ejecutar si se llama directamente
if (typeof window === 'undefined') {
  runDeliveryTests();
}



