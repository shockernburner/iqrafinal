import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Loader2 } from "lucide-react";
import { useCreateDonationCheckout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function Donate() {
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const { toast } = useToast();

  const checkoutMutation = useCreateDonationCheckout({
    mutation: {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ title: "Checkout Error", description: "No checkout URL returned.", variant: "destructive" });
        }
      },
      onError: (error: any) => {
        toast({ title: "Checkout Error", description: error?.error || "Failed to create checkout session.", variant: "destructive" });
      }
    }
  });

  const handleDonate = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }
    
    checkoutMutation.mutate({ data: { amount: finalAmount, anonymous } });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex justify-center items-center">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
              <Heart className="w-8 h-8 fill-primary" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Support IQRA Assistant</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Your contribution helps maintain the servers and continue expanding the knowledge base of traditional Islamic wisdom.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="font-serif">Make a one-time donation</CardTitle>
              <CardDescription>Select an amount or enter a custom contribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset && !customAmount ? "default" : "outline"}
                    className={`h-16 text-lg ${amount === preset && !customAmount ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Label htmlFor="custom-amount">Custom Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                  <Input
                    id="custom-amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Other amount"
                    className="pl-10 h-14 text-lg bg-background"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setAmount(0);
                    }}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <Checkbox
                  checked={anonymous}
                  onCheckedChange={(v) => setAnonymous(v === true)}
                  data-testid="checkbox-anonymous"
                />
                <span className="text-sm text-muted-foreground">
                  List me as anonymous on the sponsors page
                </span>
              </label>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-6">
              <Button 
                size="lg" 
                className="w-full text-lg h-14 font-medium" 
                onClick={handleDonate}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Donate ${(customAmount ? parseFloat(customAmount) : amount) || 0}</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
