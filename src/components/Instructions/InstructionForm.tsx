import React from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { addInstruction } from "@/store/instructionsSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface InstructionFormProps {
  initialTime: number;
  onClose: () => void;
}

interface InstructionFormData {
  pauseDuration: number;
}

const InstructionForm: React.FC<InstructionFormProps> = ({
  initialTime,
  onClose,
}) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstructionFormData>();

  const onSubmit = (data: InstructionFormData) => {
    dispatch(
      addInstruction({
        id: Date.now().toString(),
        stopTime: Math.round(initialTime),
        pauseDuration: data.pauseDuration,
      })
    );
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Stop Time</label>
        <Input
          type="text"
          value={`${Math.round(initialTime)}ms`}
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
      </div>
    </div>
  );
};

export default InstructionForm;
