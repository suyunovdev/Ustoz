import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
                    </div>
                </div>

                <h2 className="text-2xl font-medium text-foreground mb-2">
                    Sahifa topilmadi
                </h2>
                <p className="text-muted-foreground mb-8">
                    Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga
                    ko&apos;chirilgan.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200 shadow-warm"
                    >
                        <Icon name="HomeIcon" size={16} />
                        Bosh sahifaga qaytish
                    </Link>
                </div>
            </div>
        </div>
    );
}
