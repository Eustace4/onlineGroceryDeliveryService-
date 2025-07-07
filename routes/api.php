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
// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    //Authcontroller routes
    Route::get('/profile', [AuthController::class, 'profile']);
    //Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/users/{id}', [AuthController::class, 'updateUserById']);

    //userController routes
    Route::get('/users', [UserController::class, 'index']);       // View all users
    Route::get('/users/{id}', [UserController::class, 'show']); 
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    //ProductController routes (Vendor/Admin only - add role check in controller)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/businesses/{id}/products', [ProductController::class, 'productsByBusiness']);

    //BusinessController routes
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::get('/businesses', [BusinessController::class, 'index']);     // get all businesses
    Route::get('/businesses/{id}', [BusinessController::class, 'show']); // get a business by ID
    Route::put('/businesses/{id}', [BusinessController::class, 'update']);
    Route::delete('/businesses/{id}', [BusinessController::class, 'destroy']);

    //products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    //categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'myOrders']);
    Route::post('orders/{order}/assign-rider', [OrderController::class, 'assignRider']);


    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::get('/addresses', [AddressController::class, 'index']); // Customer views their addresses
    Route::get('/addresses/{id}', [AddressController::class, 'userAddresses']); // Admin views any user's addresses

    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);

    Route::get('/rider/orders', [RiderController::class, 'assignedOrders']);
    Route::put('/rider/orders/{orderId}/update-status', [RiderController::class, 'updateDeliveryStatus']);
    
});
