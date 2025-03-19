
import React, { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ReviewDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reviewDate: string) => void;
  appointmentId: string;
}

const ReviewDateModal = ({ isOpen, onClose, onSave, appointmentId }: ReviewDateModalProps) => {
  const [reviewDate, setReviewDate] = useState<string>(
    format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );

  const handleSave = () => {
    onSave(reviewDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Next Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-health-600" />
            <Input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-health-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-health-600 hover:bg-health-700">Save Review Date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDateModal;
