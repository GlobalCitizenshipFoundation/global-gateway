import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, DisplayRule } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { showError } from '@/utils/toast';

interface ConditionalLogicBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  fieldToEdit: FormField | null;
  allFields: FormField[];
  onSave: (fieldId: string, rules: DisplayRule[]) => void;
}

const ConditionalLogicBuilder = ({
  isOpen,
  onClose,
  fieldToEdit,
  allFields,
  onSave,
}: ConditionalLogicBuilderProps) => {
  const [rules, setRules] = useState<DisplayRule[]>([]);

  useEffect(() => {
    if (fieldToEdit) {
      setRules(fieldToEdit.display_rules || []);
    } else {
      setRules([]);
    }
  }, [fieldToEdit]);

  const availableTriggerFields = allFields.filter(f => f.id !== fieldToEdit?.id);

  const addRule = () => {
    setRules([...rules, { field_id: '', operator: 'equals', value: '' }]);
  };

  const updateRule = (index: number, key: keyof DisplayRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [key]: value };
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!fieldToEdit) return;

    // Basic validation: ensure all parts of a rule are selected/filled
    for (const rule of rules) {
      if (!rule.field_id || !rule.operator || (rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && rule.value === '')) {
        showError("Please complete all parts of each display rule.");
        return;
      }
    }

    onSave(fieldToEdit.id, rules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Conditional Logic for "{fieldToEdit?.label}"</DialogTitle>
          <DialogDescription>
            Define rules for when this field should be displayed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {rules.length === 0 && (
            <p className="text-muted-foreground text-sm">No rules defined. Add a rule to get started.</p>
          )}
          {rules.map((rule, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-center gap-2 border p-3 rounded-md">
              <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <Select
                  value={rule.field_id}
                  onValueChange={(val) => updateRule(index, 'field_id', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTriggerFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label} ({f.field_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={rule.operator}
                  onValueChange={(val) => updateRule(index, 'operator', val as DisplayRule['operator'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">is equal to</SelectItem>
                    <SelectItem value="not_equals">is not equal to</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="not_contains">does not contain</SelectItem>
                    <SelectItem value="is_empty">is empty</SelectItem>
                    <SelectItem value="is_not_empty">is not empty</SelectItem>
                  </SelectContent>
                </Select>

                {(rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty') && (
                  <Input
                    placeholder="Value"
                    value={rule.value as string}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                  />
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeRule(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addRule} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Logic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionalLogicBuilder;