import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImage, uploadImages } from "../../../services/api/uploadService";
import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  createProduct,
  updateProduct,
  getProductById,
  getShops,
  ProductVariation,
  Shop,
} from "../../../services/api/productService";
import {
  getCategories,
  getSubcategories,
  getSubSubCategories,
  Category,
  SubCategory,
  SubSubCategory,
} from "../../../services/api/categoryService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands, Brand } from "../../../services/api/brandService";
import {
  getHeaderCategoriesPublic,
  HeaderCategory,
} from "../../../services/api/headerCategoryService";

export default function SellerAddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    subcategory: "",
    subSubCategory: "",
    publish: "No",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    tags: "",
    smallDescription: "",
    seoTitle: "",
    seoKeywords: "",
    seoImageAlt: "",
    seoDescription: "",
    variationType: "",
    manufacturer: "",
    madeIn: "",
    tax: "",
    isReturnable: "No",
    maxReturnDays: "",
    fssaiLicNo: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    galleryImageUrls: [] as string[],
    isShopByStoreOnly: "No",
    shopId: "",
  });

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationForm, setVariationForm] = useState({
    title: "",
    price: "",
    discPrice: "0",
    stock: "0",
    status: "Available" as "Available" | "Sold out",
  });

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>(
    []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>(
    []
  );
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>(
    []
  );
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use Promise.allSettled to ensure one failing API doesn't break all others
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getBrands(),
          getHeaderCategoriesPublic(),
          getShops(),
        ]);

        // Handle categories
        if (results[0].status === "fulfilled" && results[0].value.success) {
          setCategories(results[0].value.data);
        }

        // Handle taxes
        if (results[1].status === "fulfilled" && results[1].value.success) {
          setTaxes(results[1].value.data);
        }

        // Handle brands
        if (results[2].status === "fulfilled" && results[2].value.success) {
          setBrands(results[2].value.data);
        }

        // Handle header categories
        if (results[3].status === "fulfilled") {
          const headerCatRes = results[3].value;
          if (headerCatRes && Array.isArray(headerCatRes)) {
            // Filter only Published header categories
            const published = headerCatRes.filter(
              (hc: HeaderCategory) => hc.status === "Published"
            );
            setHeaderCategories(published);
          }
        }

        // Handle shops (optional - for Shop By Store feature)
        if (results[4].status === "fulfilled" && results[4].value.success) {
          setShops(results[4].value.data);
        } else if (results[4].status === "rejected") {
          // Shops API failed - this is non-critical, log and continue
          console.warn(
            "Failed to fetch shops (Shop By Store feature may be unavailable):",
            results[4].reason?.message || "Unknown error"
          );
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await getProductById(id);
          if (response.success && response.data) {
            const product = response.data;
            setFormData({
              productName: product.productName,
              headerCategory:
                (product.headerCategoryId as any)?._id ||
                (product as any).headerCategoryId ||
                "",
              category:
                (product.category as any)?._id || product.categoryId || "",
              subcategory:
                (product.subcategory as any)?._id ||
                product.subcategoryId ||
                "",
              subSubCategory:
                (product.subSubCategory as any)?._id ||
                (product as any).subSubCategoryId ||
                "",
              publish: product.publish ? "Yes" : "No",
              popular: product.popular ? "Yes" : "No",
              dealOfDay: product.dealOfDay ? "Yes" : "No",
              brand: (product.brand as any)?._id || product.brandId || "",
              tags: product.tags.join(", "),
              smallDescription: product.smallDescription || "",
              seoTitle: product.seoTitle || "",
              seoKeywords: product.seoKeywords || "",
              seoImageAlt: product.seoImageAlt || "",
              seoDescription: product.seoDescription || "",
              variationType: product.variationType || "",
              manufacturer: product.manufacturer || "",
              madeIn: product.madeIn || "",
              tax: (product.tax as any)?._id || product.taxId || "",
              isReturnable: product.isReturnable ? "Yes" : "No",
              maxReturnDays: product.maxReturnDays?.toString() || "",
              fssaiLicNo: product.fssaiLicNo || "",
              totalAllowedQuantity:
                product.totalAllowedQuantity?.toString() || "10",
              mainImageUrl: product.mainImageUrl || product.mainImage || "",
              galleryImageUrls: product.galleryImageUrls || [],
              isShopByStoreOnly: (product as any).isShopByStoreOnly
                ? "Yes"
                : "No",
              shopId:
                (product as any).shopId?._id || (product as any).shopId || "",
            });
            setVariations(product.variations);
            if (product.mainImageUrl || product.mainImage) {
              setMainImagePreview(
                product.mainImageUrl || product.mainImage || ""
              );
            }
            if (product.galleryImageUrls) {
              setGalleryImagePreviews(product.galleryImageUrls);
            }
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setUploadError("Failed to fetch product details");
        }
      };
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubs = async () => {
      if (formData.category) {
        try {
          const res = await getSubcategories(formData.category);
          if (res.success) setSubcategories(res.data);
        } catch (err) {
          console.error("Error fetching subcategories:", err);
        }
      } else {
        setSubcategories([]);
        // Clear subcategory selection when category is cleared
        setFormData((prev) => ({ ...prev, subcategory: "" }));
      }
    };
    // Only fetch if category changed and user is interacting (or initial load)
    // For edit mode, we want to load subcategories for the selected category
    if (formData.category) {
      fetchSubs();
    }
  }, [formData.category]);

  useEffect(() => {
    const fetchSubSubs = async () => {
      if (formData.subcategory) {
        try {
          const res = await getSubSubCategories(formData.subcategory);
          if (res.success) setSubSubCategories(res.data);
        } catch (err) {
          console.error("Error fetching sub-subcategories:", err);
        }
      } else {
        setSubSubCategories([]);
        setFormData((prev) => ({ ...prev, subSubCategory: "" }));
      }
    };
    if (formData.subcategory) {
      fetchSubSubs();
    }
  }, [formData.subcategory]);

  // Clear category and subcategory when header category changes
  useEffect(() => {
    if (formData.headerCategory) {
      // Header category selected - check if current category belongs to it
      const currentCategory = categories.find(
        (cat: any) => (cat._id || cat.id) === formData.category
      );
      if (currentCategory) {
        const catHeaderId =
          typeof currentCategory.headerCategoryId === "string"
            ? currentCategory.headerCategoryId
            : currentCategory.headerCategoryId?._id;
        // If current category doesn't belong to selected header category, clear it
        if (catHeaderId !== formData.headerCategory) {
          setFormData((prev) => ({
            ...prev,
            category: "",
            subcategory: "",
            subSubCategory: "",
          }));
          setSubcategories([]);
          setSubSubCategories([]);
        }
      }
    } else {
      // Header category cleared - clear category and subcategory
      setFormData((prev) => ({
        ...prev,
        category: "",
        subcategory: "",
      }));
      setSubcategories([]);
    }
  }, [formData.headerCategory, categories]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid image file");
      return;
    }

    setMainImageFile(file);
    setUploadError("");

    try {
      const preview = await createImagePreview(file);
      setMainImagePreview(preview);
    } catch (error) {
      setUploadError("Failed to create image preview");
    }
  };

  const handleGalleryImagesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const invalidFiles = files.filter((file) => !validateImageFile(file).valid);
    if (invalidFiles.length > 0) {
      setUploadError(
        "Some files are invalid. Please check file types and sizes."
      );
      return;
    }

    setGalleryImageFiles(files);
    setUploadError("");

    try {
      const previews = await Promise.all(
        files.map((file) => createImagePreview(file))
      );
      setGalleryImagePreviews(previews);
    } catch (error) {
      setUploadError("Failed to create image previews");
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariation = () => {
    if (!variationForm.title || !variationForm.price) {
      setUploadError("Please fill in variation title and price");
      return;
    }

    const price = parseFloat(variationForm.price);
    const discPrice = parseFloat(variationForm.discPrice || "0");
    const stock = parseInt(variationForm.stock || "0");

    if (discPrice > price) {
      setUploadError("Discounted price cannot be greater than price");
      return;
    }

    const newVariation: ProductVariation = {
      title: variationForm.title,
      price,
      discPrice,
      stock,
      status: variationForm.status,
    };

    setVariations([...variations, newVariation]);
    setVariationForm({
      title: "",
      price: "",
      discPrice: "0",
      stock: "0",
      status: "Available",
    });
    setUploadError("");
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    // Basic validation
    if (!formData.productName.trim()) {
      setUploadError("Please enter a product name.");
      return;
    }

    // Only validate categories if NOT shop by store only
    if (formData.isShopByStoreOnly !== "Yes") {
      if (!formData.headerCategory) {
        setUploadError("Please select a header category.");
        return;
      }
      if (!formData.category) {
        setUploadError("Please select a category.");
        return;
      }
    }

    setUploading(true);

    try {
      // Keep local copies so we don't rely on async state updates before submit
      let mainImageUrl = formData.mainImageUrl;
      let galleryImageUrls = [...formData.galleryImageUrls];

      // Upload main image if provided
      if (mainImageFile) {
        const mainImageResult = await uploadImage(
          mainImageFile,
          "aadekh/products"
        );
        mainImageUrl = mainImageResult.secureUrl;
        setFormData((prev) => ({
          ...prev,
          mainImageUrl,
        }));
      }

      // Upload gallery images if provided
      if (galleryImageFiles.length > 0) {
        const galleryResults = await uploadImages(
          galleryImageFiles,
          "aadekh/products/gallery"
        );
        galleryImageUrls = galleryResults.map((result) => result.secureUrl);
        setFormData((prev) => ({ ...prev, galleryImageUrls }));
      }

      // Validate variations
      if (variations.length === 0) {
        setUploadError("Please add at least one product variation");
        setUploading(false);
        return;
      }

      // Prepare product data for API
      const tagsArray = formData.tags
        ? formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
        : [];

      const productData = {
        productName: formData.productName,
        headerCategoryId: formData.headerCategory || undefined,
        categoryId: formData.category || undefined,
        subcategoryId: formData.subcategory || undefined,
        subSubCategoryId: formData.subSubCategory || undefined,
        brandId: formData.brand || undefined,
        publish: formData.publish === "Yes",
        popular: formData.popular === "Yes",
        dealOfDay: formData.dealOfDay === "Yes",
        seoTitle: formData.seoTitle || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        seoImageAlt: formData.seoImageAlt || undefined,
        seoDescription: formData.seoDescription || undefined,
        smallDescription: formData.smallDescription || undefined,
        tags: tagsArray,
        manufacturer: formData.manufacturer || undefined,
        madeIn: formData.madeIn || undefined,
        taxId: formData.tax || undefined,
        isReturnable: formData.isReturnable === "Yes",
        maxReturnDays: formData.maxReturnDays
          ? parseInt(formData.maxReturnDays)
          : undefined,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity || "10"),
        fssaiLicNo: formData.fssaiLicNo || undefined,
        mainImageUrl: mainImageUrl || undefined,
        galleryImageUrls,
        variations: variations,
        variationType: formData.variationType || undefined,
        isShopByStoreOnly: formData.isShopByStoreOnly === "Yes",
        shopId:
          formData.isShopByStoreOnly === "Yes" && formData.shopId
            ? formData.shopId
            : undefined,
      };

      // Create or Update product via API
      let response;
      if (id) {
        response = await updateProduct(id as string, productData);
      } else {
        response = await createProduct(productData);
      }

      if (response.success) {
        setSuccessMessage(
          id ? "Product updated successfully!" : "Product added successfully!"
        );
        setTimeout(() => {
          // Reset form or navigate
          if (!id) {
            setFormData({
              productName: "",
              headerCategory: "",
              category: "",
              subcategory: "",
              subSubCategory: "",
              publish: "No",
              popular: "No",
              dealOfDay: "No",
              brand: "",
              tags: "",
              smallDescription: "",
              seoTitle: "",
              seoKeywords: "",
              seoImageAlt: "",
              seoDescription: "",
              variationType: "",
              manufacturer: "",
              madeIn: "",
              tax: "",
              isReturnable: "No",
              maxReturnDays: "",
              fssaiLicNo: "",
              totalAllowedQuantity: "10",
              mainImageUrl: "",
              galleryImageUrls: [],
              isShopByStoreOnly: "No",
              shopId: "",
            });
            setVariations([]);
            setMainImageFile(null);
            setMainImagePreview("");
            setGalleryImageFiles([]);
            setGalleryImagePreviews([]);
          }
          setSuccessMessage("");
          // Navigate to product list
          navigate("/seller/product/list");
        }, 1500);
      } else {
        setUploadError(response.message || "Failed to create product");
      }
    } catch (error: any) {
      setUploadError(
        error.response?.data?.message ||
        error.message ||
        "Failed to upload images. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-gray-800">
          {id ? "Edit Product" : "Add New Product"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {id ? "Modify your product details and variations" : "Create a new product listing in your inventory"}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Product Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                Basic Information
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 01</span>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Enter Product Name"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Header Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="headerCategory"
                    value={formData.headerCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="">Select Header</option>
                    {headerCategories.map((headerCat) => (
                      <option key={headerCat._id} value={headerCat._id}>
                        {headerCat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={!formData.headerCategory}
                    className={`w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium ${!formData.headerCategory
                      ? "bg-neutral-50 cursor-not-allowed opacity-60"
                      : "bg-white"
                      }`}>
                    <option value="">
                      {formData.headerCategory
                        ? "Select Category"
                        : "Pick Header First"}
                    </option>
                    {categories
                      .filter((cat: any) => {
                        // Filter categories by selected header category if header category is selected
                        if (formData.headerCategory) {
                          const catHeaderId =
                            typeof cat.headerCategoryId === "string"
                              ? cat.headerCategoryId
                              : cat.headerCategoryId?._id;
                          return catHeaderId === formData.headerCategory;
                        }
                        return true;
                      })
                      .map((cat: any) => (
                        <option
                          key={cat._id || cat.id}
                          value={cat._id || cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    SubCategory
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    disabled={!formData.category}
                    className={`w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium ${!formData.category
                      ? "bg-neutral-50 cursor-not-allowed opacity-60"
                      : "bg-white"
                      }`}>
                    <option value="">Select Sub</option>
                    {subcategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.subcategoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Sub-SubCategory
                  </label>
                  <select
                    name="subSubCategory"
                    value={formData.subSubCategory}
                    onChange={handleChange}
                    disabled={!formData.subcategory}
                    className={`w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium ${!formData.subcategory
                      ? "bg-neutral-50 cursor-not-allowed opacity-60"
                      : "bg-white"
                      }`}>
                    <option value="">Select Sub-Sub</option>
                    {subSubCategories.map((subSub) => (
                      <option key={subSub._id} value={subSub._id}>
                        {subSub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Status
                  </label>
                  <select
                    name="publish"
                    value={formData.publish}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="No">Save as Draft</option>
                    <option value="Yes">Publish Now</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Brand
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="">Generic / No Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Popular Product?
                  </label>
                  <select
                    name="popular"
                    value={formData.popular}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Show in Trending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Deal of the Day?
                  </label>
                  <select
                    name="dealOfDay"
                    value={formData.dealOfDay}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes, Featured</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Search Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="tag1, tag2..."
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                  Small Description
                </label>
                <textarea
                  name="smallDescription"
                  value={formData.smallDescription}
                  onChange={handleChange}
                  placeholder="Summarize your product in few words..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium resize-none shadow-inner bg-neutral-50/30"
                />
              </div>
            </div>
          </div>

          {/* SEO Content Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                SEO & Metadata
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 02</span>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleChange}
                    placeholder="Brief, catchy title for search engines"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Keywords
                  </label>
                  <input
                    type="text"
                    name="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={handleChange}
                    placeholder="grocery, fresh, etc."
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    name="seoImageAlt"
                    value={formData.seoImageAlt}
                    onChange={handleChange}
                    placeholder="Describe the product image"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                  Meta Description
                </label>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleChange}
                  placeholder="Detailed description for search results..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium resize-none shadow-inner bg-neutral-50/30"
                />
              </div>
            </div>
          </div>

          {/* Add Variation Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                Product Variations
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 03</span>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="max-w-md">
                <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">
                  Variation Type
                </label>
                <select
                  name="variationType"
                  value={formData.variationType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                  <option value="">Select Scale</option>
                  <option value="Size">Size (S, M, L)</option>
                  <option value="Weight">Weight (kg, g)</option>
                  <option value="Color">Color</option>
                  <option value="Pack">Pack (Pack of 2, 4)</option>
                </select>
              </div>

              {/* Variation Form Card */}
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 tracking-widest mb-1 italic">Title (e.g. 500g)</label>
                    <input
                      type="text"
                      value={variationForm.title}
                      onChange={(e) => setVariationForm({ ...variationForm, title: e.target.value })}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-teal-500 outline-none text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 tracking-widest mb-1 italic">MRP (₹) *</label>
                    <input
                      type="number"
                      value={variationForm.price}
                      onChange={(e) => setVariationForm({ ...variationForm, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-teal-500 outline-none text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 tracking-widest mb-1 italic">Sale Price (₹)</label>
                    <input
                      type="number"
                      value={variationForm.discPrice}
                      onChange={(e) => setVariationForm({ ...variationForm, discPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-teal-500 outline-none text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 tracking-widest mb-1 italic">Stock (Qty)</label>
                    <input
                      type="number"
                      value={variationForm.stock}
                      onChange={(e) => setVariationForm({ ...variationForm, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-teal-500 outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 mt-2">
                    <button
                      type="button"
                      onClick={addVariation}
                      className="w-full bg-neutral-900 hover:bg-black text-white py-2.5 rounded-lg font-black tracking-widest text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add Variation
                    </button>
                  </div>
                </div>
              </div>

              {/* Variations List as Cards */}
              {variations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {variations.map((variation, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl shadow-sm group">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 font-black text-xs">
                        {variation.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-neutral-800 text-sm truncate">{variation.title || "No Title"}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-teal-600">₹{variation.price}</span>
                          {variation.discPrice > 0 && <span className="text-[10px] text-neutral-400 line-through">₹{variation.price}</span>}
                          <span className="text-[10px] font-bold text-neutral-400 ml-auto">Stock: {variation.stock}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="p-2 text-neutral-300 hover:text-red-500 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Other Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                Additional Logistics
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 04</span>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Made In</label>
                  <input
                    type="text"
                    name="madeIn"
                    value={formData.madeIn}
                    onChange={handleChange}
                    placeholder="Country"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Tax Category</label>
                  <select
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="">Select Tax</option>
                    {taxes.map((tax) => (
                      <option key={tax._id} value={tax._id}>
                        {tax.name} ({tax.percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Returnable?</label>
                  <select
                    name="isReturnable"
                    value={formData.isReturnable}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Max Return (Days)</label>
                  <input
                    type="number"
                    name="maxReturnDays"
                    value={formData.maxReturnDays}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">FSSAI Lic. No.</label>
                  <input
                    type="text"
                    name="fssaiLicNo"
                    value={formData.fssaiLicNo}
                    onChange={handleChange}
                    placeholder="14-digit number"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1">Order Limit (per User)</label>
                  <input
                    type="number"
                    name="totalAllowedQuantity"
                    value={formData.totalAllowedQuantity}
                    onChange={handleChange}
                    placeholder="No limit"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Images Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                Product Media
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 05</span>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-neutral-500 tracking-widest mb-3 italic">
                  Main Product Image <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <label className="relative group cursor-pointer">
                    <div className="aspect-square bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:border-teal-500 group-hover:bg-teal-50/10 overflow-hidden">
                      {mainImagePreview ? (
                        <div className="w-full h-full relative">
                          <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-black tracking-widest">Change Photo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400 group-hover:text-teal-500 group-hover:bg-teal-50 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          </div>
                          <p className="text-[10px] font-black tracking-tighter text-neutral-400 group-hover:text-teal-600">Drop your image</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" disabled={uploading} />
                  </label>

                  {mainImagePreview && (
                    <div className="space-y-3">
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <p className="text-[10px] font-black text-neutral-400 tracking-widest mb-1 italic">File Info</p>
                        <p className="text-xs font-bold text-neutral-800 truncate">{mainImageFile?.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMainImageFile(null); setMainImagePreview(""); }}
                        className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-black tracking-widest hover:bg-red-100 transition-colors">
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-black text-neutral-500 tracking-widest mb-3 italic">
                  Gallery Images (Max 10)
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {galleryImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                  {galleryImagePreviews.length < 10 && (
                    <label className="aspect-square bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/10 transition-all">
                      <div className="text-neutral-400 group-hover:text-teal-500 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </div>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shop by Store Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wider">
                Store Visibility
              </h2>
              <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Step 06</span>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <p className="text-xs font-bold text-blue-800 leading-relaxed tracking-tight">
                  "Shop by Store Only" makes this product exclusive to your store page.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1 italic">Exclusive visibility?</label>
                  <select
                    name="isShopByStoreOnly"
                    value={formData.isShopByStoreOnly}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.isShopByStoreOnly === "Yes" && (
                  <div>
                    <label className="block text-xs font-black text-neutral-500 tracking-widest mb-1 italic">Select Store <span className="text-red-500">*</span></label>
                    <select
                      name="shopId"
                      value={formData.shopId}
                      onChange={handleChange}
                      required={formData.isShopByStoreOnly === "Yes"}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-medium bg-white">
                      <option value="">Select Store</option>
                      {shops.map((shop) => (
                        <option key={shop._id} value={shop._id}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                    {shops.length === 0 && (
                      <p className="text-[10px] text-red-400 font-bold mt-1">No active stores available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pb-8">
            <button
              type="submit"
              disabled={uploading}
              className={`w-full sm:w-auto px-10 py-4 rounded-xl font-black text-sm tracking-widest transition-all shadow-lg active:scale-95 ${uploading
                ? "bg-neutral-300 text-white cursor-not-allowed"
                : "bg-teal-600 hover:bg-neutral-900 text-white"
                }`}>
              {uploading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </div>
              ) : (
                id ? "Save Changes" : "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
