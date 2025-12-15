"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Search, Edit, Plus } from "lucide-react";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Loader } from "@/components/loader";
import EditFeeModal from "@/components/EditFeeModal";
import AddFeeModal from "@/components/AddFeeModal";
import { useQueryClient } from "@tanstack/react-query";
import { MonthFilter } from "@/components/filters/month-filter";

type FeeWithDetails = {
  id: string;
  studentId: string;
  classId: string;
  feeToBePaid: string;
  feePaid: string | null;
  feeUnpaid: string | null;
  paymentDate: Date | null;
  createdAt: Date;
  studentName: string;
  fatherName: string;
  className: string;
  teacherName: string;
};

type FeeApiResponse = {
  id: string;
  studentId: string;
  classId: string;
  feeToBePaid: string;
  feePaid: string | null;
  feeUnpaid: string | null;
  paymentDate: string | null;
  createdAt: string;
  studentName: string;
  fatherName: string;
  className: string;
  teacherName: string;
};

export default function FeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedFee, setSelectedFee] = useState<FeeWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: fees = [], isLoading } = useQuery<
    FeeApiResponse[],
    Error,
    FeeWithDetails[]
  >({
    queryKey: ["/api/fees"],
    queryFn: async () => {
      const response = await fetch("/api/fees");
      if (!response.ok) {
        throw new Error("Failed to fetch fees");
      }
      return response.json();
    },
    select: (data) =>
      data.map((fee) => ({
        ...fee,
        paymentDate: fee.paymentDate ? new Date(fee.paymentDate) : null,
        createdAt: new Date(fee.createdAt),
      })),
  });

  const handleEditFee = (fee: FeeWithDetails) => {
    setSelectedFee(fee);
    setIsEditModalOpen(true);
  };

  const handleFeeUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedFee(null);
    queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
  };

  const handleFeeAddSuccess = () => {
    setIsAddModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
  };

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth =
      selectedMonth === "all" ||
      (selectedMonth === "this-month"
        ? fee.createdAt.getMonth() + 1 === new Date().getMonth() + 1
        : fee.createdAt.getMonth() + 1 === parseInt(selectedMonth));

    return matchesSearch && matchesMonth;
  });

  const totalFees = filteredFees.reduce(
    (sum, fee) => sum + parseFloat(fee.feeToBePaid),
    0
  );
  const totalPaid = filteredFees.reduce(
    (sum, fee) => sum + parseFloat(fee.feePaid || "0"),
    0
  );
  const totalUnpaid = filteredFees.reduce(
    (sum, fee) => sum + parseFloat(fee.feeUnpaid || "0"),
    0
  );

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="md" text="Loading fees..." />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mt-1">
                Track and manage student fee payments
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Fee</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Fees
                </CardTitle>
                <Coins className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {totalFees.toFixed(2)} ؋
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Paid
                </CardTitle>
                <Coins className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {totalPaid.toFixed(2)} ؋
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Unpaid
                </CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    totalUnpaid > 0 ? "text-red-600" : ""
                  }`}
                >
                  {totalUnpaid.toFixed(2)} ؋
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 sm:gap-6 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center">
              <MonthFilter value={selectedMonth} onChange={setSelectedMonth} />
            </div>
          </div>

          <div className="text-end mr-2">
            <Badge variant="secondary">Total {filteredFees.length} fees</Badge>
          </div>
          <div className="space-y-4">
            {filteredFees.map((fee) => (
              <Card key={fee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {fee.studentName}
                          </h3>
                          <Badge
                            variant="outline"
                            className="self-start text-xs"
                          >
                            {fee.className}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFee(fee)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                          <p className="hidden sm:block">Edit</p>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Father: {fee.fatherName} | Teacher: {fee.teacherName}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                        <span className="whitespace-nowrap">
                          Fee: {fee.feeToBePaid} ؋
                        </span>
                        <span className="whitespace-nowrap">
                          Paid: {fee.feePaid || "0"} ؋
                        </span>
                        {parseFloat(fee.feeUnpaid || "0") > 0 && (
                          <span className="whitespace-nowrap text-red-600">
                            Unpaid: {fee.feeUnpaid || "0"} ؋
                          </span>
                        )}
                        <Badge
                          variant={fee.feePaid ? "default" : "destructive"}
                          className="whitespace-nowrap"
                        >
                          {fee.feePaid ? "Paid" : "Pending"}
                        </Badge>
                        {fee.paymentDate && (
                          <span className="whitespace-nowrap">
                            Paid on: {fee.paymentDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredFees.length === 0 && searchTerm && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No fees found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <EditFeeModal
            fee={selectedFee}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleFeeUpdateSuccess}
          />

          <AddFeeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleFeeAddSuccess}
          />
        </>
      )}
    </div>
  );
}
