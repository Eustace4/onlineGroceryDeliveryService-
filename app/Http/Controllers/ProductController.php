<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    // View all products (public)
    public function index()
    {
        return Product::with('category', 'business')->get();
    }

    // View one product by ID (public)
    public function show($id)
    {
        return Product::with('category', 'business')->findOrFail($id);
    }

    // Create product (vendor/admin only)
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'vendor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'category_name' => 'required|string',
            'business_id' => 'required|exists:businesses,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Check vendor owns the business
        if ($user->role === 'vendor' && !$user->businesses()->where('id', $request->business_id)->exists()) {
            return response()->json(['message' => 'You do not own this business'], 403);
        }

        // Find category by name
        $category = Category::where('name', $request->category_name)->first();
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('product_images', 'public');
        }

        // Create product
        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'category_id' => $category->id,
            'business_id' => $request->business_id,
            'image' => $imagePath,
        ]);

        return response()->json(['message' => 'Product created', 'product' => $product], 201);
    }


    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        // Check vendor owns the business the product belongs to
        if ($user->role === 'vendor' && !$user->businesses()->where('id', $product->business_id)->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric',
            'stock' => 'sometimes|integer',
            'category_name' => 'sometimes|string', // If you want to accept category by name for update
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // If category_name is provided, find the category and update category_id
        if ($request->has('category_name')) {
            $category = Category::where('name', $request->category_name)->first();
            if (!$category) {
                return response()->json(['message' => 'Category not found'], 404);
            }
            $product->category_id = $category->id;
        }

        // Handle image update
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('product_images', 'public');
        }

        // Update other fields
        $product->fill($request->except(['image', 'category_name']));
        $product->save();

        return response()->json(['message' => 'Product updated', 'product' => $product]);
    }


    // Delete product
    public function destroy($id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if (
            $user->role === 'vendor' &&
            !$user->businesses()->where('id', $product->business_id)->exists()
        ) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
