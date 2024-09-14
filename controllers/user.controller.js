import { User } from "../Models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";


// ___________________________  ____________________________________________________________________________________________________


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json( {
                    message: 'Somthing is missing, plese check!',
                    success: false
                } )
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: 'Email is already in use, try a different email!',
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await user.create({
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: 'Account Created Successfully.',
            success: true   
        });
    }
    catch (error) {
        console.log(error);

    }

}
// _______________________________________________________________________________________________________________________________
 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) 
            { return res.status(401).json({
                    message: 'Somthing is missing, plese check!',
                    success: false
                                        })
            }
            

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                message: 'Incorrect email or password',
                success: false,
                                       })
                   }
                   

        const IsPasswordMatch = await bcrypt.compare(password, user.password)
        if (!IsPasswordMatch){
            return res.status(401).json({
                message: 'Incorrect email or password',
                success: false
                                        })
                             }


                             

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts,
        }
        const token =  await jwt.sign({ userId:user._id }, process.env.SECRET_KEY, { expiresIn: '1d' })
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 } ).
        json({
                message: `Welcome back ${user.username}`,
                success: true,
                user
            });
        }

    catch (error) {
        console.log(error);

    }
}





// _______________________________________________________________________________________________________________________________


export const logout = async (_, res) => {
    try {
         return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully',
            success: true
        });
    } catch (error) {
        console.log(error);
        
        ;
    }
};

// _______________________________________________________________________________________________________________________________


export const getProfile = async (req, res) => {
    try {

        const userId = req.params.id;
        let user = await User.findById(userId);
        return res.status(200).json({
            user,
            success: true
        })
    }

    catch (error) {
        console.log(error);

    }

};

// _______________________________________________________________________________________________________________________________

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDatauri(profilePicture); // Spelling correction needed here
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId);
        if (!user) { 
            return res.status(404).json({
                message: 'user not found',
                success: false 
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
    }
};

// _______________________________________________________________________________________________________________________________


export const getSugestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: {$ne: req.id }}).select("-password");
        
        if (suggestedUsers.length === 0) {
            return res.status(400).json({
                message: 'Currently do not have any users',
                success: false
            });
        }
        
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        });

    } catch (error) {
        console.log(error);
       
    }
};

// _______________________________________________________________________________________________________________________________


export const followOrUnfollow = async (req, res) => {
    try {
        const followKarneWala = req.id;  
        const jiskoFollowKarunga = req.params.id; 

        if (followKarneWala === jiskoFollowKarunga) {
            return res.status(400).json({
                message: 'You cannot follow or unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(followKarneWala);
        const targetUser = await User.findById(jiskoFollowKarunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }

        const isFollowing = user.following.includes(jiskoFollowKarunga);
        if (isFollowing) {
            
            await Promise.all([
                User.updateOne({ _id: followKarneWala }, { $pull: { following: jiskoFollowKarunga } }),
                User.updateOne({ _id: jiskoFollowKarunga }, { $pull: { followers: followKarnewala } })
            ]);
            return res.status(200).json({
                message: 'Unfollowed successfully',
                success: true
            });
        } else {
          
            await Promise.all([
                User.updateOne({ _id: followKarneWala }, { $push: { following: jiskoFollowKarunga } }),
                User.updateOne({ _id: jiskoFollowKarunga }, { $push: { followers: followKarneWala } })
            ]);
            return res.status(200).json({
                message: 'Followed successfully',
                success: true
            });
        }
    } catch (error) {
        console.log(error);
    }
};
