"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Search, Edit, Users } from "lucide-react";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Loader } from "@/components/loader";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/filters/search-input";
import EditFeeModal from "@/components/EditFeeModal";
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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFee, setSelectedFee] = useState<FeeWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  const handleFeeUpdateSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedFee(null);
    queryClient.invalidateQueries({ queryKey: ["/api/fees"] });

    // Create notification for fee update
    try {
      await fetch("/api/notifications/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Fee Updated",
          message: `Fee record for ${selectedFee?.studentName} has been updated successfully.`,
          type: "info",
        }),
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  };

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesMonth =
      selectedMonth === "all" ||
      (selectedMonth === "this-month"
        ? fee.createdAt.getMonth() + 1 === new Date().getMonth() + 1
        : fee.createdAt.getMonth() + 1 === parseInt(selectedMonth));

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "paid" && parseFloat(fee.feePaid || "0") > 0) ||
      (selectedStatus === "unpaid" && parseFloat(fee.feePaid || "0") === 0) ||
      (selectedStatus === "debtors" && parseFloat(fee.feeUnpaid || "0") > 0);

    return matchesSearch && matchesMonth && matchesStatus;
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString("default", {
    month: "long",
  });

  const totalPaid = fees
    .filter((fee) => {
      const inCurrentMonth =
        fee.createdAt.getMonth() + 1 === currentMonth &&
        fee.createdAt.getFullYear() === currentYear;
      return inCurrentMonth;
    })
    .reduce((sum, fee) => sum + parseFloat(fee.feePaid || "0"), 0);
  const totalUnpaid = fees
    .filter((fee) => {
      const inCurrentMonth =
        fee.createdAt.getMonth() + 1 === currentMonth &&
        fee.createdAt.getFullYear() === currentYear;
      return inCurrentMonth;
    })
    .reduce((sum, fee) => sum + parseFloat(fee.feeUnpaid || "0"), 0);
  const paidStudentsCount = fees.filter((fee) => {
    const paid = parseFloat(fee.feePaid || "0") > 0;
    const date = fee.paymentDate;
    const inCurrentMonth =
      date &&
      date.getMonth() + 1 === currentMonth &&
      date.getFullYear() === currentYear;
    return paid && inCurrentMonth;
  }).length;

  return (
    <div className="space-y-6">
      <OfflineIndicator />

      <PageHeader description="Track and manage student fee payments" />

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <Loader variant="skeleton" shape="fees" className="max-w-none" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title={`Students Paid (${currentMonthName})`}
              value={paidStudentsCount}
              icon={Users}
              tone="info"
            />
            <StatsCard
              title={`Total Paid (${currentMonthName})`}
              value={`${totalPaid.toFixed(2)} ؋`}
              icon={Coins}
              tone="success"
            />
            <StatsCard
              title={`Total Unpaid (${currentMonthName})`}
              value={`${totalUnpaid.toFixed(2)} ؋`}
              icon={Coins}
              tone="warning"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-lg border bg-muted/30 p-3 sm:p-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, student ID, class..."
            />
            <div className="flex items-center gap-2">
              <MonthFilter
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="debtors">Debtors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-end mr-2">
            <Badge variant="secondary">Total {filteredFees.length} fees</Badge>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            {filteredFees.map((fee) => (
              <Card
                key={fee.id}
                className={
                  parseFloat(fee.feeUnpaid || "0") > 0 ? "border-destructive" : ""
                }
              >
                <CardContent className="p-4 sm:p-6">
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
                          <span className="whitespace-nowrap text-destructive">
                            Unpaid: {fee.feeUnpaid || "0"} ؋
                          </span>
                        )}
                        <Badge
                          variant={fee.feePaid ? "success" : "warning"}
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
              <EmptyState
                icon={Search}
                title="No fees found"
                description="Try adjusting your search terms."
              />
            )}

            {filteredFees.length === 0 && !searchTerm && (
              <EmptyState
                icon={Coins}
                title="No fee records found"
                description="Try adjusting your filters, or add fee records to get started."
              />
            )}
          </div>

          <EditFeeModal
            fee={selectedFee}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleFeeUpdateSuccess}
          />
        </>
      )}
    </div>
  );
}
