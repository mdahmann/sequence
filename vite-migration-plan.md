# Vite to Next.js Migration Plan

This document outlines the detailed plan to incorporate the best elements of the Vite-based sequence app into our Next.js application.

The Vite app is located under the 'sequence-app' folder in the same directory as this Next.js app.

## Comparative Analysis

### Vite App Strengths
- More intuitive sequence generation UI with fluid interactions (slider for duration, visual grouping)
- Better visual hierarchy and spacing in all components
- Superior organization of sequence data with logical phases
- Elegant handling of bilateral poses (left/right sides)
- Clean separation of concerns (services, components, types)
- More sophisticated UI with animations and transitions
- Better feedback mechanisms during generation/editing

### Next.js App Challenges
- More rigid form controls with less intuitive interactions
- Less visual polish and spacing in components
- Basic pose arrangement without sophisticated side handling
- Mixed client/server concerns without clear separation
- More utilitarian design with less engaging user experience

### Database Considerations
The Next.js app uses Supabase with tables for `sequences`, `poses`, and `sequence_poses`. We'll adapt the Vite app's phase-based structure to work with this schema without modifications.

## Detailed Implementation Plan

### Phase 1: Setup and Planning (Completed)

#### Progress

1. **Design System Integration**
   - ✅ Created design-tokens.ts file to capture Vite app's design system
   - ✅ Updated Tailwind config with custom colors and animations from Vite app
   - ✅ Added framer-motion for enhanced animations

2. **Enhanced UI Components**
   - ✅ Created enhanced Slider component with ticks and animations
   - ✅ Created enhanced RadioGroup component with multiple variants
   - ✅ Created enhanced PoseCard component with side selection and animations
   - ✅ Created PhaseDisplay component to implement phase-based sequence structure

3. **Sequence Service Implementation**
   - ✅ Created sequence-service.ts to handle phase-based approach
   - ⬜ Need to fix type issues with Supabase response data (will address in Phase 2)

4. **Technical Challenges Addressed**
   - ✅ Created adapter pattern for converting database records to phase structure
   - ✅ Implemented position-based ordering for poses in phases
   - ✅ Created mapping approach for Supabase response data
   - ✅ Used --legacy-peer-deps flag to resolve React version conflicts

#### Phase 1 Summary
We've successfully completed Phase 1 by creating all the foundational components and services needed for the migration. Our enhanced UI components (Slider, RadioGroup, PoseCard, PhaseDisplay) now match the visual style and functionality of the Vite app while being compatible with our Next.js application. The sequence service adapts the phase-based approach of the Vite app to work with our existing database schema.

### Phase 2: Sequence Generation Improvements (Next Steps)

#### Detailed Tasks

1. **Implement Enhanced Sequence Generator Form**
   - Replace the current sequence-generator.tsx with a new version using our enhanced components
   - Implement the slider for duration selection
   - Use the enhanced radio group for difficulty selection
   - Add animations for better user feedback
   - Connect to the existing API endpoint

2. **Create Service Layer**
   - Complete the sequence service implementation
   - Add proper error handling and validation
   - Create a client-side service wrapper for the API
   - Implement optimistic updates for better UX

3. **Refine User Experience**
   - Add loading indicators with animations
   - Implement toast notifications for success/error states
   - Add form validation with inline feedback
   - Implement smooth transitions between form steps

#### Implementation Plan
1. Start by creating a new version of the sequence generator component
2. Implement the form with enhanced components
3. Connect to the existing API endpoints
4. Test the new sequence generator thoroughly
5. Replace the existing component once testing is complete

### Phase 3: Sequence Editor Transformation (3-4 days)
1. **Phase-Based Structure**
   - Implement the concept of sequence phases in the UI
   - Create a model adapter to transform database data to phase structure
   - Build UI components for phase visualization

2. **Bilateral Pose Handling**
   - Enhance pose components to better handle side variations
   - Implement left/right side grouping in the sequence display
   - Add UI controls for toggling sides

3. **Visual Enhancements**
   - Improve card design for poses
   - Add proper spacing and hierarchy
   - Implement animations for pose transitions

### Phase 4: Scalability Improvements (2-3 days)
1. **Optimized Data Fetching**
   - Implement proper data fetching patterns (SWR or React Query)
   - Add server-side caching for frequently accessed data
   - Optimize database queries

2. **Performance Enhancements**
   - Code splitting for large components
   - Lazy loading for non-critical UI elements
   - Image optimization for pose images

3. **User Experience at Scale**
   - Implement pagination for sequence listing
   - Add search and filtering capabilities
   - Improve error handling and recovery

### Phase 5: Testing and Refinement (2-3 days)
1. **Cross-Browser Testing**
   - Ensure compatibility across all major browsers
   - Test performance on different devices

2. **User Testing**
   - Perform usability testing with sample users
   - Gather feedback and make adjustments

3. **Final Refinements**
   - Address any remaining visual inconsistencies
   - Optimize any slow-performing components
   - Ensure accessibility compliance

## Technical Considerations for Scalability

1. **Database Optimization**
   - Implement proper indexing for frequently queried fields
   - Consider read replicas for scaling read operations
   - Use connection pooling to handle many concurrent users

2. **Serverless Architecture**
   - Leverage Next.js API routes and serverless functions
   - Implement proper caching strategies
   - Consider edge functions for global performance

3. **Content Delivery**
   - Use CDN for static assets
   - Implement proper caching headers
   - Consider image optimization services

4. **Monitoring and Analytics**
   - Add performance monitoring
   - Implement user analytics to understand usage patterns
   - Set up error tracking and reporting

## Component Migration List

### UI Components to Migrate
1. GenerationForm (Vite) → sequence-generator.tsx (Next.js)
2. SequenceFlow (Vite) → sequence-editor.tsx (Next.js)
3. PoseCard (Vite) → sortable-pose-item.tsx (Next.js)

### Services to Adapt
1. sequenceGenerationService.ts (Vite) → Create equivalent services in Next.js
2. poseService.ts (Vite) → Adapt to work with Supabase client

### Data Models to Reconcile
1. Sequence/SequencePhase/SequencePose (Vite) → Map to Next.js database schema
2. Pose types (Vite) → Ensure compatibility with Next.js pose structure

## Key Features to Implement

### Sequence Generation
- Slider for duration selection instead of dropdown
- Cleaner radio button selection for difficulty level
- Better visual feedback during generation
- Improved layout with clear section delineation

### Sequence Editor
- Phase-based organization of poses
- Better bilateral pose handling (left/right sides)
- Improved drag and drop experience
- More intuitive pose editing interface

### Visual Enhancements
- Consistent spacing and visual hierarchy
- Animations for state changes and transitions
- Better loading and error states
- More polished overall design

## Technical Debt to Address
- Clean separation of client and server concerns
- Better type definitions across the application
- Improved error handling and recovery
- Consistent data fetching patterns

## Timeline and Resources
- Total estimated time: 10-14 days
- Required resources: 1-2 frontend developers
- Priority: High - This will significantly improve user experience 

## Technical Learning

### Typescript Type-Safety with Supabase

When working with Supabase responses, we need to carefully map the returned data to our domain models. The following pattern works well:

```typescript
// Get typed data with proper joins
const { data, error } = await supabase
  .from("table")
  .select(`
    id,
    other_fields,
    related_table (
      id,
      name
    )
  `);

// Safely process the data with type checking
const mappedData = [];
for (const item of data || []) {
  if (item.related_table) {
    mappedData.push({
      id: item.id,
      relatedData: {
        id: item.related_table.id,
        name: item.related_table.name
      }
    });
  }
}
```

### Phase-Based Structure with Flat Database

To implement the phase-based structure with our flat sequence_poses table:

1. Group sequence poses by position ranges
2. Use position field to maintain order within and across phases
3. When saving, calculate new position values based on phase index and position within phase 