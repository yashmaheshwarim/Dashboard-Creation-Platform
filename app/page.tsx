"use client"

import { ArrowRight, BarChart3, FileSpreadsheet, PieChart, TrendingUp, Upload, Users, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <BarChart3 className="h-6 w-6 mr-2" />
          <span className="font-bold">DataInsight Pro</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Transform Your Data Into
                <span className="text-blue-600"> Actionable Insights</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Upload CSV, Excel, or PDF files and instantly create interactive dashboards with powerful analytics and
                beautiful visualizations.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/upload">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Powerful Features</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to analyze your data and make informed decisions.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Upload className="h-8 w-8 mb-2 text-blue-600" />
                <CardTitle>Multi-Format Upload</CardTitle>
                <CardDescription>
                  Support for CSV, Excel (.xlsx, .xls), and PDF files with automatic data extraction and parsing.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <PieChart className="h-8 w-8 mb-2 text-green-600" />
                <CardTitle>Interactive Dashboards</CardTitle>
                <CardDescription>
                  Create stunning visualizations with charts, graphs, and tables that update in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 mb-2 text-purple-600" />
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Get deep insights with trend analysis, statistical summaries, and predictive modeling.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-yellow-600" />
                <CardTitle>Real-time Processing</CardTitle>
                <CardDescription>
                  Lightning-fast data processing and visualization updates as you explore your data.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileSpreadsheet className="h-8 w-8 mb-2 text-red-600" />
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Organize, filter, and manipulate your datasets with powerful data management tools.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-indigo-600" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share dashboards and insights with your team for collaborative data analysis.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Get Started?</h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Upload your first dataset and start creating beautiful dashboards in minutes.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/upload">
                  Upload Your Data <Upload className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">© 2024 DataInsight Pro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
