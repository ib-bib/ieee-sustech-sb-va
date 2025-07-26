'use client'

import { CheckIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { signIn } from "next-auth/react"

import WhiteSpinner from "~/app/_components/white_spinner"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordShowing, setPasswordShowing] = useState(false)
    const [validUser, setValidUser] = useState(false)

    const handleLogin = async () => {
        setLoading(true)

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        })

        setLoading(false)

        if (res?.ok) {
            setValidUser(true)
            router.push("/")
        } else {
            alert("Login failed")
        }
        setValidUser(true)
    }

    return <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="rounded-2xl shadow-2xl w-96 h-96 flex flex-col justify-between py-4 items-center backdrop-blur-xs">
            <Link href="/" className="w-16 sm:w-18 md:w-20 lg:w-22 xl:w-24">
                <Image
                    src="/IEEE-Branch-logo-blue-bg_transparent.png"
                    alt="IEEE SUSTech Student Branch"
                    width={500}
                    height={500}
                    className="w-full h-auto"
                    priority
                />
            </Link>
            <div className="flex flex-col gap-2">
                <div>
                    <label htmlFor="email">Email</label>
                    <div className="flex justify-between gap-2 items-center p-3 border border-neutral-300 rounded-2xl">
                        <EnvelopeIcon className="size-5" />
                        <input className="outline-none" placeholder="name@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        <EnvelopeIcon className="size-5 invisible" />
                    </div>
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <div className="flex justify-between gap-2 items-center p-3 border border-neutral-300 rounded-2xl">
                        <LockClosedIcon className="size-5" />
                        <input className="outline-none" type={passwordShowing ? 'text' : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <button
                            onClick={() => setPasswordShowing(!passwordShowing)}
                            type="button" className="size-5">
                            {passwordShowing ?
                                <EyeIcon className="size-5" />
                                :
                                <EyeSlashIcon className="size-5" />
                            }
                        </button>
                    </div>
                </div>
            </div>
            <button
                onClick={handleLogin}
                disabled={loading}
                className="bg-[#00B5E2] hover:cursor-pointer hover:bg-[#00629B] active:bg-[#002855] transition-all w-30 h-10 text-neutral-50 rounded-2xl flex justify-center items-center gap-1 disabled:bg-[#002855]"
                type="button"
            >
                {loading && <WhiteSpinner />}
                {validUser && !loading && <CheckIcon className="size-5" />}
                {!loading && !validUser && "Log in"}
            </button>
        </div>
    </main>
}