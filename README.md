# Cap Table Management Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13.4+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?logo=supabase)](https://supabase.com/)

A modern, full-stack application for managing company capitalization tables, funding rounds, and equity distribution.

## ✨ Features

- **Company Management**: Create and manage company profiles with detailed information
- **Cap Table Visualization**: Interactive visualization of company ownership structure
- **Funding Rounds**: Track and manage funding rounds with various instruments (SAFE, Convertible Notes, Priced Rounds)
- **Equity Management**: Manage equity grants, options, and ownership percentages
- **Scenario Modeling**: Model different funding and exit scenarios
- **Role-Based Access**: Secure authentication and authorization using Clerk
- **Responsive Design**: Fully responsive UI that works on all devices

## 🧮 Mathematical Engine

The application features a robust mathematical engine that handles complex financial calculations with precision and reliability. The engine is built with type safety in mind and includes comprehensive test coverage.

### Core Capabilities

#### 1. Precision and Accuracy
- **Decimal Precision**: All calculations use exact decimal arithmetic to prevent floating-point errors
- **Rounding Control**: Configurable rounding methods (round, floor, ceil) with adjustable precision
- **Consistency Checks**: Built-in validation to ensure cap table integrity after each operation

#### 2. Equity Calculations
- **Ownership Tracking**: Precise calculation of ownership percentages to 4 decimal places
- **Share Counting**: Whole share calculations to prevent fractional shares
- **Vesting Schedules**: Support for various vesting schedules with cliff periods

#### 3. Funding Round Modeling
- **Pre/Post-Money Valuation**: Accurate calculation of valuations and share prices
- **Dilution Analysis**: Detailed impact analysis on existing shareholders
- **Option Pool Management**: Dynamic adjustment of option pools in funding rounds

#### 4. Financial Instruments
- **SAFE Notes**: Conversion calculations with valuation caps and discount rates
- **Convertible Notes**: Interest accrual and conversion mechanics
- **Preferred Stock**: Multiple series with different rights and preferences

#### 5. Scenario Analysis
- **What-If Modeling**: Project future funding rounds and their impact
- **Exit Scenarios**: Calculate payouts under different exit valuations
- **Sensitivity Analysis**: Understand how changes in assumptions affect outcomes

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with React 19 and TypeScript
- **State Management**: React Context API with custom hooks
- **UI Components**: Built with Radix UI primitives and Tailwind CSS
- **Data Visualization**: Recharts for interactive charts and graphs
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Clerk for secure user management

### Backend
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **API**: Next.js API routes with TypeScript
- **Authentication**: JWT-based authentication via Clerk
- **Real-time Updates**: Supabase real-time subscriptions

### Security
- Row Level Security (RLS) policies for data access control
- Environment variable validation
- Secure authentication flows with Clerk
- Input validation with Zod
- CSRF protection and CORS policies

### Testing
- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for browser automation
- **Integration Tests**: API route testing

## 💰 Financial Assumptions & Methodologies

### 1. Valuation Framework
- **Pre-Money Valuation**: Used as the basis for calculating ownership percentages
- **Post-Money Calculation**: Pre-money + Investment Amount = Post-money valuation
- **Option Pool Impact**: Option pool can be created pre or post-money based on configuration

### 2. Equity Distribution
- **Vesting Schedules**: Standard 4-year vesting with 1-year cliff
- **Early Exercise**: Support for 83(b) election tracking
- **Exercise Windows**: Configurable periods for option exercise after termination

### 3. Funding Instruments
#### SAFE Notes
- **Valuation Cap**: Maximum valuation used for conversion
- **Discount Rate**: Applied to the price per share in next round
- **MFN Clause**: Most Favored Nation provision support
- **Pro Rata Rights**: Option to maintain ownership percentage

#### Convertible Notes
- **Interest Rate**: Simple interest accrual until conversion
- **Maturity Date**: Automatic conversion at maturity if not triggered earlier
- **Qualified Financing**: Conversion triggers at specified funding thresholds

### 4. Dilution Protection
- **Weighted Average**: Broad-based and narrow-based calculations
- **Full Ratchet**: Protection against down rounds
- **Pay-to-Play**: Provisions requiring participation to maintain anti-dilution rights

### 5. Liquidation Preferences
- **Multiple Preferences**: Support for 1x, 2x, etc.
- **Participation**: With and without caps
- **Seniority**: Multiple series with different priority levels
- **Deemed Liquidation Events**: M&A, asset sales, and other trigger events

### 6. Tax Considerations
- **409A Valuations**: Tracking of fair market value
- **Exercise Timing**: Impact on tax treatment
- **Early Exercise**: 83(b) election implications

### 7. Reporting & Compliance
- **Cap Table Reports**: Detailed ownership breakdowns
- **409A Documentation**: Historical valuation tracking
- **Board Approvals**: Documentation of major transactions

### 8. Assumption Validation
- **Sensitivity Analysis**: Testing key assumptions
- **Scenario Modeling**: Best/worst case projections
- **Audit Trail**: Complete history of all calculations

- Pro-rata rights management

### 3. Dilution and Conversion
- Automatic dilution calculations for new funding rounds
- Anti-dilution provisions (weighted average)
- Convertible note conversion at qualified financing events
- Interest accrual on convertible instruments

### 4. Tax and Compliance
- 409A valuation tracking
- FMV calculations for stock options
- Tax reporting exports (PDF/Excel)
- Audit trail of all cap table changes

## 🔄 Application Workflow

### User Authentication & Onboarding
1. **Sign Up/Login**: Users authenticate via Clerk
2. **Company Setup**: New users go through an onboarding flow to set up their company profile
3. **Initial Cap Table Setup**: Users can either:
   - Start from scratch
   - Import existing cap table data (CSV/Excel)
   - Use a template based on company stage

### Core Functionality

#### 1. Dashboard
- Overview of company metrics
- Recent activity feed
- Quick actions (add round, manage shareholders, etc.)

#### 2. Cap Table Management
- View current ownership structure
- Add/remove shareholders
- Manage equity grants and options
- Track vesting schedules

#### 3. Funding Rounds
- Create and manage funding rounds (SAFE, Convertible Notes, Priced Rounds)
- Model different investment scenarios
- Track round documents and terms
- Calculate dilution impact

#### 4. Scenario Modeling
- Create "what-if" scenarios
- Model different exit outcomes
- Compare multiple scenarios side by side
- Export scenario reports

#### 5. Document Generation
- Generate cap table reports
- Create investment documents
- Export data for accounting/financial reporting

### User Roles & Permissions
- **Admin**: Full access to all features
- **Executive**: Can view all data, limited editing capabilities
- **Investor**: View-only access to relevant company data
- **Employee**: Limited view of personal equity information

## 🚀 Technology Stack

- **Frontend**:
  - Next.js 13+ (App Router)
  - React 18+
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Recharts for data visualization

- **Backend**:
  - Next.js API Routes
  - Supabase (PostgreSQL)
  - Row-Level Security (RLS)
  - Clerk for authentication

- **Development Tools**:
  - ESLint + Prettier
  - TypeScript
  - Vitest for unit testing
  - Playwright for E2E testing
  - Husky for Git hooks

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Clerk account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pranavv05/cap-table-tool.git
   cd cap-table-tool
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase and Clerk credentials

4. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
.
├── app/                    # Next.js 13+ app directory
│   ├── api/                # API routes
│   ├── dashboard/          # Main application dashboard
│   └── ...
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── public/                 # Static assets
├── scripts/                # Database and utility scripts
├── styles/                 # Global styles
└── tests/                  # Test files
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
See `.env.local.example` for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
- [Clerk Documentation](https://clerk.com/docs) - learn about Clerk authentication.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- The open-source community for amazing tools and libraries
