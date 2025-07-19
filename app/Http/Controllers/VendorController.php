<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Business;

class VendorController extends Controller
{
    public function businesses(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'vendor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $businesses = Business::where('user_id', $user->id)->get();
        
        return response()->json($businesses);
    }
    // VendorController.php
    public function dashboardSummary(Request $request)
    {
        $vendorId = auth()->user()->id;

        $businesses = Business::where('vendor_id', $vendorId)
            ->with(['orders' => function ($query) {
                $query->where('status', '!=', 'cancelled'); // optional filter
            }])
            ->get()
            ->map(function ($business) {
                $totalRevenue = $business->orders->sum('total_price');
                $totalOrders = $business->orders->count();

                return [
                    'id' => $business->id,
                    'name' => $business->name,
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                ];
            });

        return response()->json($businesses);
    }

}