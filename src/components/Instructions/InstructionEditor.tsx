import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { selectCurrentTime } from "@/store/timelineSlice";
import {
  addInstruction,
  removeInstruction,
  selectSelectedInstructionId,
  selectInstructions,
} from "@/store/instructionsSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Trash2 } from "lucide-react";

interface InstructionFormData {
  pauseDuration: number;
}

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);
  const selectedInstructionId = useSelector(selectSelectedInstructionId);
  const instructions = useSelector(selectInstructions);
  const selectedInstruction = instructions.find(
    (i) => i.id === selectedInstructionId
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InstructionFormData>({
    defaultValues: {
      pauseDuration: selectedInstruction?.pauseDuration || 0,
    },
  });

  useEffect(() => {
    if (selectedInstruction) {
      setValue("pauseDuration", selectedInstruction.pauseDuration);
    } else {
      reset({ pauseDuration: 0 });
    }
  }, [selectedInstruction, setValue, reset]);

  const onSubmit = (data: InstructionFormData) => {
    dispatch(
      addInstruction({
        id: selectedInstructionId || Date.now().toString(),
        stopTime: currentTime,
        pauseDuration: data.pauseDuration,
      })
    );
  };

  const handleDelete = () => {
    if (selectedInstructionId) {
      dispatch(removeInstruction(selectedInstructionId));
      reset({ pauseDuration: 0 });
    }
  };

  return (
    <div className="mt-4 p-4 bg-background border border-border rounded-lg">
      <h3 className="text-sm font-medium text-foreground mb-4">
        {selectedInstructionId ? "Edit Instruction" : "Add Instruction"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Stop Time</label>
          <Input
            type="text"
            value={`${Math.round(currentTime)}ms`}
            disabled
            className="bg-muted/20"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            Pause Duration (ms)
          </label>
          <Input
            type="number"
            {...register("pauseDuration", { required: true, min: 0 })}
          />
          {errors.pauseDuration && (
            <span className="text-xs text-destructive">
              This field is required
            </span>
          )}
        </div>

        <div className="flex justify-between">
          {selectedInstructionId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
          <Button type="submit">
            {selectedInstructionId ? "Update" : "Add"} Instruction
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InstructionEditor;
