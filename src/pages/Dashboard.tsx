import React from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, Users, CreditCard, Image } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const adminSections = [
  {
    title: "Products",
    description: "Manage product catalog",
    icon: Package,
    link: "/admin/products",
    color: "text-blue-500",
  },
  {
    title: "Orders",
    description: "View and manage orders",
    icon: ShoppingCart,
    link: "/admin/orders",
    color: "text-green-500",
  },
  {
    title: "Customers",
    description: "Customer management",
    icon: Users,
    link: "/admin/customers",
    color: "text-purple-500",
  },
  {
    title: "Payments",
    description: "Payment transactions",
    icon: CreditCard,
    link: "/admin/payments",
    color: "text-orange-500",
  },
  {
    title: "Banners",
    description: "Manage homepage banners",
    icon: Image,
    link: "/admin/banners",
    color: "text-pink-500",
  },
];

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link to={section.link} key={section.title}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-6 w-6 ${section.color}`} />
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{section.description}</CardDescription>
                      <div className="text-sm text-gray-500 mt-2">
                        Click to manage {section.title.toLowerCase()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
