"use client";

import * as React from "react";
import { useRef } from "react";
import Image from "next/image";
import type { PutBlobResult } from "@vercel/blob";
import type { UseFormReturn } from "react-hook-form";

import type { InsertPage } from "@openstatus/db/src/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@openstatus/ui";

import { SectionHeader } from "../shared/section-header";

interface Props {
  form: UseFormReturn<InsertPage>;
}

export function SectionAdvanced({ form }: Props) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  /**
   * Determine the width and height of the uploaded image - it ideally is a square
   */
  const getFileDimensions = async (file: File) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  };

  const handleChange = async (file: FileList | null) => {
    if (!file || file.length === 0) {
      return;
    }

    const { height, width } = await getFileDimensions(file[0]);

    // remove rounding issues from transformations
    if (!(Math.abs(height - width) <= 1)) {
      setOpen(true);
      setFile(file[0]);
      return;
    }

    const newblob = await handleUpload(file[0]);
    form.setValue("icon", newblob.url);
  };

  const handleUpload = async (file: File) => {
    const response = await fetch(`/api/upload?filename=${file.name}`, {
      method: "POST",
      body: file,
    });

    const newblob = (await response.json()) as PutBlobResult;
    return newblob;
  };

  const handleCancel = () => {
    inputFileRef.current?.value && (inputFileRef.current.value = "");
  };

  const handleConfirm = async () => {
    if (file) {
      const newblob = await handleUpload(file);
      form.setValue("icon", newblob.url);
      setFile(null);
    }
    setOpen(false);
  };

  return (
    <div className="grid w-full gap-4 md:grid-cols-3">
      <SectionHeader
        title="Advanced Settings"
        description="Provide informations about what your status page is for. A favicon can be uploaded to customize your status page. It will be used as an icon on the header as well."
        className="md:col-span-full"
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="md:col-span-full">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Input
                placeholder="Stay informed about our api and website health."
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide your users informations about it.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="icon"
        render={({ field }) => (
          <FormItem className="col-span-full md:col-span-1">
            <FormLabel>Favicon</FormLabel>
            <FormControl>
              <>
                {!field.value && (
                  <Input
                    type="file"
                    accept="image/x-icon,image/png"
                    ref={inputFileRef}
                    onChange={(e) => handleChange(e.target.files)}
                  />
                )}
                {field.value && (
                  <div className="flex items-center">
                    <div className="border-border h-10 w-10 rounded-sm border p-1">
                      <Image
                        src={field.value}
                        width={64}
                        height={64}
                        alt="Favicon"
                      />
                    </div>
                    <Button
                      variant="link"
                      onClick={() => {
                        form.setValue("icon", "");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </>
            </FormControl>
            <FormDescription>Your status page favicon</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <AlertDialog open={open} onOpenChange={(value) => setOpen(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incorrect image size</AlertDialogTitle>
            <AlertDialogDescription>
              For the best result, the image should be a square. You can still
              upload it, but it will be cropped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
