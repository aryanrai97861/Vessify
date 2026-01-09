"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  category: string | null;
  confidence: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchTransactions = useCallback(async (cursor?: string) => {
    setLoadingTransactions(true);
    try {
      const url = new URL(`${backendUrl}/api/transactions`);
      if (cursor) url.searchParams.set("cursor", cursor);
      url.searchParams.set("limit", "10");

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      if (cursor) {
        setTransactions((prev) => [...prev, ...data.transactions]);
      } else {
        setTransactions(data.transactions);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [backendUrl, router]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    } else if (session) {
      fetchTransactions();
    }
  }, [session, isPending, router, fetchTransactions]);

  const handleExtract = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setExtractedResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/transactions/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Extraction failed");
      }

      const data = await response.json();
      setExtractedResult(data.transaction);
      setText("");
      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Vessify</h1>
            <p className="text-slate-400">Personal Finance Transaction Extractor</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{session?.user?.email}</span>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Extract Transaction Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Extract Transaction</CardTitle>
            <CardDescription className="text-slate-400">
              Paste your bank statement text and we&apos;ll extract the transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your bank statement text here...

Example:
Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <Button
              onClick={handleExtract}
              disabled={loading || !text.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Parsing..." : "Parse & Save"}
            </Button>

            {/* Extracted Result */}
            {extractedResult && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
                <h3 className="text-green-400 font-semibold">Transaction Saved!</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Date:</div>
                  <div className="text-white">{formatDate(extractedResult.date)}</div>
                  <div className="text-slate-400">Description:</div>
                  <div className="text-white">{extractedResult.description}</div>
                  <div className="text-slate-400">Amount:</div>
                  <div className={extractedResult.amount < 0 ? "text-red-400" : "text-green-400"}>
                    {formatCurrency(extractedResult.amount)}
                  </div>
                  {extractedResult.balance && (
                    <>
                      <div className="text-slate-400">Balance:</div>
                      <div className="text-white">{formatCurrency(extractedResult.balance)}</div>
                    </>
                  )}
                  {extractedResult.category && (
                    <>
                      <div className="text-slate-400">Category:</div>
                      <div className="text-white">{extractedResult.category}</div>
                    </>
                  )}
                  <div className="text-slate-400">Confidence:</div>
                  <div className="text-white">{(extractedResult.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Your Transactions</CardTitle>
            <CardDescription className="text-slate-400">
              All your extracted transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 && !loadingTransactions ? (
              <div className="text-center py-8 text-slate-400">
                No transactions yet. Extract your first transaction above!
              </div>
            ) : (
              <>
                <div className="rounded-md border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Description</TableHead>
                        <TableHead className="text-slate-300">Category</TableHead>
                        <TableHead className="text-slate-300 text-right">Amount</TableHead>
                        <TableHead className="text-slate-300 text-right">Balance</TableHead>
                        <TableHead className="text-slate-300 text-right">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-slate-700 hover:bg-slate-800/50">
                          <TableCell className="text-white">{formatDate(tx.date)}</TableCell>
                          <TableCell className="text-white max-w-[200px] truncate">{tx.description}</TableCell>
                          <TableCell className="text-slate-300">{tx.category || "-"}</TableCell>
                          <TableCell className={`text-right ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-white text-right">
                            {tx.balance ? formatCurrency(tx.balance) : "-"}
                          </TableCell>
                          <TableCell className="text-slate-300 text-right">
                            {(tx.confidence * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {nextCursor && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchTransactions(nextCursor)}
                      disabled={loadingTransactions}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      {loadingTransactions ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
