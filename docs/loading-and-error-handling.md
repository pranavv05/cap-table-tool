## Enhanced Loading States and Error Boundaries - Usage Guide

This guide demonstrates how to use the new loading states and error boundary components implemented in the cap table tool.

### Loading Component Examples

```tsx
import { Loading, TableSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/loading"

// Basic spinner
<Loading size="md" message="Loading data..." />

// Financial loading with rotating icons
<Loading variant="financial" size="lg" message="Calculating complex scenarios..." />

// Card loading state
<Loading variant="card" size="lg" message="Loading dashboard..." />

// Page-level loading
<Loading variant="page" size="xl" message="Setting up your workspace..." />

// Skeleton loaders for specific content
<TableSkeleton rows={5} columns={4} />
<ChartSkeleton height="h-64" />
<CardSkeleton />
```

### Error Boundary Examples

```tsx
import { 
  PageErrorBoundary, 
  SectionErrorBoundary, 
  ComponentErrorBoundary,
  useErrorHandler 
} from "@/components/ui/error-boundary"

// Page-level error boundary (for entire pages)
<PageErrorBoundary>
  <DashboardPage />
</PageErrorBoundary>

// Section-level error boundary (for major sections)
<SectionErrorBoundary onError={(error) => console.log('Section error:', error)}>
  <CapTableSection />
</SectionErrorBoundary>

// Component-level error boundary (for individual components)
<ComponentErrorBoundary resetKeys={[data.id]}>
  <ChartComponent data={data} />
</ComponentErrorBoundary>

// Using error handler hook for async operations
function MyComponent() {
  const handleError = useErrorHandler()
  
  const fetchData = async () => {
    try {
      await apiCall()
    } catch (error) {
      handleError(error)
    }
  }
}
```

### Integration in Existing Components

#### Dashboard Page Enhancement
- Added comprehensive loading skeleton while data loads
- Implemented error handling with retry functionality
- Enhanced data fetching with timeout protection
- Graceful handling of partial data failures

#### Professional Cap Table Interface
- Wrapped charts with error boundaries
- Added loading states for different tab contents
- Implemented section-level error recovery
- Enhanced funding round display with component-level error handling

#### Funding Round Dialog
- Added form submission loading states
- Implemented success/error feedback
- Enhanced error reporting with user-friendly messages
- Added loading indicators during API calls

### Key Features

1. **Multiple Loading Variants**:
   - Spinner: Basic loading indicator
   - Skeleton: Content placeholder
   - Card: Card-based loading state
   - Financial: Animated icons for financial calculations
   - Page: Full-page loading state

2. **Hierarchical Error Boundaries**:
   - Page level: Complete page failure handling
   - Section level: Isolated section error recovery
   - Component level: Individual component protection

3. **Error Recovery**:
   - Automatic retry mechanisms
   - Reset on prop changes
   - User-friendly error messages
   - Development error details

4. **Loading State Management**:
   - Delayed loading indicators
   - Context-aware loading messages
   - Smooth loading transitions
   - Progressive loading states

### Best Practices

1. **Use appropriate loading variants** based on content type
2. **Implement error boundaries at multiple levels** for granular error handling
3. **Provide meaningful loading messages** to improve user experience
4. **Handle partial failures gracefully** in data fetching
5. **Use skeleton loaders** for predictable content layouts
6. **Implement retry mechanisms** for recoverable errors
7. **Show progress indicators** for long-running operations

### Error Types Handled

- Network failures
- API timeouts  
- Data parsing errors
- Component rendering errors
- Permission errors
- Resource not found errors
- General application errors

The enhanced error handling and loading states significantly improve the user experience by providing clear feedback during operations and graceful recovery from failures.