<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ForgotPasswordController;


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
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    //BusinessController routes
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::get('/businesses', [BusinessController::class, 'index']);     // get all businesses
    Route::get('/businesses/{id}', [BusinessController::class, 'show']); // get a business by ID
    Route::put('/businesses/{id}', [BusinessController::class, 'update']);
    Route::delete('/businesses/{id}', [BusinessController::class, 'destroy']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
  
});
