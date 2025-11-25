"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Input } from "./input";
import { Trash2, Loader2, Copy, Check } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
}

const CONFIRM_TEXT = "I WANT TO DELETE THIS PROJECT";

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: DeleteConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConfirmed = inputValue === CONFIRM_TEXT;

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setInputValue("");
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setInputValue("");
    setCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CONFIRM_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Project">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
          <p className="text-sm text-red-800">
            You are about to permanently delete <strong>{projectName}</strong>. 
            This action cannot be undone. All deployment data, logs, and configurations will be lost.
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-600 mb-2">
            To confirm, type or click to copy:
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 w-full p-3 rounded-lg bg-red-100 border border-red-200 text-left group hover:bg-red-150 transition-colors"
          >
            <code className="flex-1 font-mono text-sm font-semibold text-red-700 select-all">
              {CONFIRM_TEXT}
            </code>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-red-400 group-hover:text-red-600 flex-shrink-0 transition-colors" />
            )}
          </button>
        </div>

        <Input
          placeholder="Type the confirmation text above"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={inputValue && !isConfirmed ? "border-red-300" : ""}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
