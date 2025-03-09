'use client';

import { FC, useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import IssueCard from './IssueCard';
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor, 
  PointerSensor, 
  closestCenter, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSocket } from '../context/SocketContext';
import { Issue } from '../types';

interface IssuesListProps {
  issues: Issue[];
  className?: string;
  onIssuesReorder?: (issues: Issue[]) => void;
}

export const IssuesList: FC<IssuesListProps> = ({ 
  issues: initialIssues, 
  className,
  onIssuesReorder 
}) => {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { socket } = useSocket();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial render
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Update local state when props change
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);
  
  // Listen for real-time updates from other users
  useEffect(() => {
    if (!socket) return;
    
    socket.on('issues:reordered', (reorderedIssues: Issue[]) => {
      setIssues(reorderedIssues);
    });
    
    socket.on('issue:updated', (updatedIssue: Issue) => {
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === updatedIssue.id ? updatedIssue : issue
        )
      );
    });
    
    return () => {
      socket.off('issues:reordered');
      socket.off('issue:updated');
    };
  }, [socket]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 8, // Increase distance for mobile
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setIssues((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reorderedIssues = arrayMove(items, oldIndex, newIndex);
        
        // Call the callback if provided
        if (onIssuesReorder) {
          onIssuesReorder(reorderedIssues);
        }
        
        // Emit the reordered issues to other users
        if (socket) {
          socket.emit('issues:reorder', reorderedIssues);
        }
        
        return reorderedIssues;
      });
    }
    
    setActiveId(null);
  };

  const activeIssue = issues.find((issue) => issue.id === activeId);

  return (
    <div className={cn("p-4", className)}>
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No issues found</h3>
          <p className="text-sm text-gray-400 max-w-md">
            There are no issues that match your current filters. Try adjusting your filters or create a new issue.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={issues.map(issue => issue.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  id={issue.id}
                  title={issue.title}
                  status={issue.status}
                  priority={issue.priority}
                  assignee={issue.assignee}
                  dueDate={issue.dueDate}
                  labels={issue.labels}
                />
              ))}
            </div>
          </SortableContext>
          
          {/* Drag overlay for the currently dragged item */}
          <DragOverlay adjustScale={true}>
            {activeIssue ? (
              <IssueCard
                id={activeIssue.id}
                title={activeIssue.title}
                status={activeIssue.status}
                priority={activeIssue.priority}
                assignee={activeIssue.assignee}
                dueDate={activeIssue.dueDate}
                labels={activeIssue.labels}
                className="opacity-80"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default IssuesList; 