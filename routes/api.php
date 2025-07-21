<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VendorController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'reset']);

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('public/businesses', [BusinessController::class, 'indexForCustomer']); // public
Route::get('/products', [ProductController::class, 'index']);
// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Admin analytics/metrics
    Route::get('/admin/metrics', [AdminController::class, 'getMetrics']);

    // Auth controller routes
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/users/{id}', [AuthController::class, 'updateUserById']);

    // User controller routes
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']); 
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Product controller routes
    
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Business controller routes
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::get('/businesses/{id}', [BusinessController::class, 'show']);
    Route::put('/businesses/{id}', [BusinessController::class, 'update']);
    Route::delete('/businesses/{id}', [BusinessController::class, 'destroy']);
    // Add this inside your Route::middleware(...) group
    Route::get('/vendor/businesses', [BusinessController::class, 'indexForVendor']);

    
    // Business products - use only one route
    Route::get('/businesses/{id}/products', [ProductController::class, 'getBusinessProducts']);

    // Categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('orders/{order}/assign-rider', [OrderController::class, 'assignRider']);
    Route::get('/orders', [OrderController::class, 'index']); 
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::get('/businesses/{id}/orders', [OrderController::class, 'getBusinessOrders']);


    // Addresses
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::get('/addresses/{id}', [AddressController::class, 'userAddresses']);
    Route::post('/addresses', [AddressController::class, 'store']);

    // Payments
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);

    // Rider routes
    Route::get('/rider/orders', [RiderController::class, 'assignedOrders']);
    Route::put('/rider/orders/{orderId}/update-status', [RiderController::class, 'updateDeliveryStatus']);
    
    // Vendor routes
    Route::get('/vendor/businesses', [VendorController::class, 'businesses']);
    Route::get('/vendor/dashboard-summary', [VendorController::class, 'dashboardSummary']);

    Route::get('/notifications', function (Request $request) {
        return $request->user()->notifications;
    });

    // Profile routes
    Route::post('/profile/upload-picture', [ProfileController::class, 'uploadProfilePicture']);
    Route::delete('/profile/remove-picture', [ProfileController::class, 'removeProfilePicture']);

});